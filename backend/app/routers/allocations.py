from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date
import uuid
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/allocations", tags=["3.0 Accommodation & Waitlist"])

@router.post("/apply", response_model=schemas.AllocationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_accommodation(
    payload: schemas.AllocationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.STUDENT]))
):
    # Check if student already has an active/pending application
    existing = db.query(models.Allocation).filter(
        models.Allocation.user_id == current_user.user_id,
        models.Allocation.status.in_([
            models.AllocationStatusEnum.PENDING,
            models.AllocationStatusEnum.APPROVED,
            models.AllocationStatusEnum.ACTIVE
        ])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active or pending accommodation application.")

    new_allocation = models.Allocation(
        user_id=current_user.user_id,
        academic_year=payload.academic_year,
        semester=payload.semester,
        preferred_room_type=payload.preferred_room_type,
        check_in_date=payload.check_in_date or date.today(),
        status=models.AllocationStatusEnum.PENDING
    )
    db.add(new_allocation)

    # Check if any rooms of preferred_room_type are currently AVAILABLE
    available_rooms = db.query(models.Room).filter(
        models.Room.type == payload.preferred_room_type,
        models.Room.status == models.RoomStatusEnum.AVAILABLE
    ).count()

    # Auto-Waitlist if no rooms of preferred type are available right now
    if available_rooms == 0:
        current_wait_count = db.query(models.Waitlist).filter(
            models.Waitlist.preferred_room_type == payload.preferred_room_type,
            models.Waitlist.status == "Waiting"
        ).count()
        wait_entry = models.Waitlist(
            user_id=current_user.user_id,
            preferred_room_type=payload.preferred_room_type,
            position=current_wait_count + 1,
            status="Waiting"
        )
        db.add(wait_entry)

    db.commit()
    db.refresh(new_allocation)
    return new_allocation

@router.get("/", response_model=List[schemas.AllocationResponse])
def list_allocations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.Allocation).options(
        joinedload(models.Allocation.student),
        joinedload(models.Allocation.room)
    )
    if current_user.role == models.RoleEnum.STUDENT:
        query = query.filter(models.Allocation.user_id == current_user.user_id)
    return query.order_by(models.Allocation.applied_at.desc()).all()

@router.get("/waitlist", response_model=List[schemas.WaitlistResponse])
def get_waitlist(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.Waitlist).options(joinedload(models.Waitlist.student))
    if current_user.role == models.RoleEnum.STUDENT:
        query = query.filter(models.Waitlist.user_id == current_user.user_id)
    return query.order_by(models.Waitlist.position.asc()).all()

# Warden / Admin Use Case: Process Application & Room Allocation
@router.post("/{booking_id}/allocate", response_model=schemas.AllocationResponse)
def allocate_room(
    booking_id: int,
    payload: schemas.AllocationApprove,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    allocation = db.query(models.Allocation).filter(models.Allocation.booking_id == booking_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Application not found")
    if allocation.status not in [models.AllocationStatusEnum.PENDING]:
        raise HTTPException(status_code=400, detail=f"Application is already {allocation.status.value}")

    room = db.query(models.Room).filter(models.Room.room_id == payload.room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Selected room not found")
    if room.status != models.RoomStatusEnum.AVAILABLE or room.current_occupancy >= room.capacity:
        raise HTTPException(status_code=400, detail="Selected room is full or under maintenance")

    # 1. Assign Room & Approve Application
    allocation.room_id = room.room_id
    allocation.status = models.AllocationStatusEnum.APPROVED
    if payload.check_in_date:
        allocation.check_in_date = payload.check_in_date
    if payload.check_out_date:
        allocation.check_out_date = payload.check_out_date

    # 2. Update Room Occupancy (D2 Inventory Update)
    room.current_occupancy += 1
    if room.current_occupancy >= room.capacity:
        room.status = models.RoomStatusEnum.FULL

    # 3. Promote student out of Waitlist if they were on it
    wait_entry = db.query(models.Waitlist).filter(
        models.Waitlist.user_id == allocation.user_id,
        models.Waitlist.status == "Waiting"
    ).first()
    if wait_entry:
        wait_entry.status = "Promoted"

    # 4. DFD Process 3.0 -> 4.0 "Fee Trigger": Generate Pending Fee Invoice in D4
    invoice_code = f"INV-{uuid.uuid4().hex[:6].upper()}"
    new_fee = models.FeePayment(
        user_id=allocation.user_id,
        booking_id=allocation.booking_id,
        amount=room.fee_per_semester,
        payment_method="Pending Payment",
        receipt_number=invoice_code,
        status="Pending"
    )
    db.add(new_fee)

    db.commit()
    db.refresh(allocation)
    return allocation

@router.post("/{booking_id}/reject", response_model=schemas.AllocationResponse)
def reject_application(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    allocation = db.query(models.Allocation).filter(models.Allocation.booking_id == booking_id).first()
    if not allocation:
        raise HTTPException(status_code=404, detail="Application not found")

    allocation.status = models.AllocationStatusEnum.REJECTED
    wait_entry = db.query(models.Waitlist).filter(
        models.Waitlist.user_id == allocation.user_id,
        models.Waitlist.status == "Waiting"
    ).first()
    if wait_entry:
        wait_entry.status = "Cancelled"

    db.commit()
    db.refresh(allocation)
    return allocation
