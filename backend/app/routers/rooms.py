from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/rooms", tags=["2.0 Room Management"])

@router.get("/", response_model=List[schemas.RoomResponse])
def get_rooms(
    block: Optional[str] = None,
    room_type: Optional[str] = None,
    status_filter: Optional[models.RoomStatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.Room)
    if block:
        query = query.filter(models.Room.block == block)
    if room_type:
        query = query.filter(models.Room.type == room_type)
    if status_filter:
        query = query.filter(models.Room.status == status_filter)
    return query.order_by(models.Room.room_number.asc()).all()

@router.get("/summary")
def get_room_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    rooms = db.query(models.Room).all()
    total_rooms = len(rooms)
    total_capacity = sum(r.capacity for r in rooms)
    total_occupied = sum(r.current_occupancy for r in rooms)
    available_rooms = sum(1 for r in rooms if r.status == models.RoomStatusEnum.AVAILABLE)
    maintenance_rooms = sum(1 for r in rooms if r.status == models.RoomStatusEnum.MAINTENANCE)

    return {
        "total_rooms": total_rooms,
        "available_rooms": available_rooms,
        "maintenance_rooms": maintenance_rooms,
        "total_capacity": total_capacity,
        "total_occupied": total_occupied,
        "vacant_beds": max(0, total_capacity - total_occupied)
    }

@router.post("/", response_model=schemas.RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(
    payload: schemas.RoomCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.ADMIN, models.RoleEnum.WARDEN]))
):
    existing = db.query(models.Room).filter(models.Room.room_number == payload.room_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")

    new_room = models.Room(**payload.model_dump())
    db.add(new_room)
    db.commit()
    db.refresh(new_room)
    return new_room

@router.patch("/{room_id}", response_model=schemas.RoomResponse)
def update_room(
    room_id: int,
    payload: schemas.RoomUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.ADMIN, models.RoleEnum.WARDEN]))
):
    room = db.query(models.Room).filter(models.Room.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(room, key, value)

    # Automatically sync room status if occupancy hits capacity
    if room.current_occupancy >= room.capacity and room.status != models.RoomStatusEnum.MAINTENANCE:
        room.status = models.RoomStatusEnum.FULL
    elif room.current_occupancy < room.capacity and room.status == models.RoomStatusEnum.FULL:
        room.status = models.RoomStatusEnum.AVAILABLE

    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.ADMIN]))
):
    room = db.query(models.Room).filter(models.Room.room_id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    db.delete(room)
    db.commit()
