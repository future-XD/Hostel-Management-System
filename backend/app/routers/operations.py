from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from typing import List
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/operations", tags=["5.0 Complaint, Inspection & Visitor Management"])

# --- COMPLAINTS & ROOM INSPECTIONS (D5 / INSPECTION_LOG) ---
@router.post("/complaints", response_model=schemas.ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint_or_inspection(
    payload: schemas.ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    target_room_id = payload.room_id

    # Auto-detect student's allocated room if not explicitly passed
    if not target_room_id and current_user.role == models.RoleEnum.STUDENT:
        active_alloc = db.query(models.Allocation).filter(
            models.Allocation.user_id == current_user.user_id,
            models.Allocation.room_id.isnot(None)
        ).order_by(models.Allocation.applied_at.desc()).first()
        if active_alloc:
            target_room_id = active_alloc.room_id

    new_log = models.ComplaintInspection(
        user_id=current_user.user_id,
        room_id=target_room_id,
        category=payload.category,
        title=payload.title,
        description=payload.description,
        cleanliness_level=payload.cleanliness_level,
        damage_severity=payload.damage_severity,
        status="Open"
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/complaints", response_model=List[schemas.ComplaintResponse])
def list_complaints_and_inspections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.ComplaintInspection).options(
        joinedload(models.ComplaintInspection.student),
        joinedload(models.ComplaintInspection.room)
    )
    if current_user.role == models.RoleEnum.STUDENT:
        query = query.filter(models.ComplaintInspection.user_id == current_user.user_id)
    return query.order_by(models.ComplaintInspection.created_at.desc()).all()

@router.patch("/complaints/{log_id}", response_model=schemas.ComplaintResponse)
def update_complaint_or_inspection(
    log_id: int,
    payload: schemas.ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    log_item = db.query(models.ComplaintInspection).filter(models.ComplaintInspection.log_id == log_id).first()
    if not log_item:
        raise HTTPException(status_code=404, detail="Complaint or inspection log not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(log_item, key, value)

    db.commit()
    db.refresh(log_item)
    return log_item

# --- VISITOR ENTRY MANAGEMENT (D5) ---
@router.post("/visitors", response_model=schemas.VisitorResponse, status_code=status.HTTP_201_CREATED)
def log_visitor_entry(
    payload: schemas.VisitorCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    student = db.query(models.User).filter(models.User.user_id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    visitor = models.VisitorLog(
        student_id=payload.student_id,
        visitor_name=payload.visitor_name,
        relation=payload.relation,
        phone=payload.phone,
        purpose=payload.purpose,
        logged_by_warden_id=current_user.user_id
    )
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor

@router.get("/visitors", response_model=List[schemas.VisitorResponse])
def list_visitor_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.VisitorLog)
    if current_user.role == models.RoleEnum.STUDENT:
        query = query.filter(models.VisitorLog.student_id == current_user.user_id)
    return query.order_by(models.VisitorLog.check_in_time.desc()).all()

@router.patch("/visitors/{visitor_id}/checkout", response_model=schemas.VisitorResponse)
def checkout_visitor(
    visitor_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    visitor = db.query(models.VisitorLog).filter(models.VisitorLog.visitor_id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor log not found")
    if visitor.check_out_time is not None:
        raise HTTPException(status_code=400, detail="Visitor has already checked out")

    visitor.check_out_time = func.now()
    db.commit()
    db.refresh(visitor)
    return visitor
