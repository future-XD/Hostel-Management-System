from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/d6", tags=["6.0 Leave & Notice Management"])

# --- LEAVE REQUESTS ---
@router.post("/leaves", response_model=schemas.LeaveResponse, status_code=status.HTTP_201_CREATED)
def apply_for_leave(
    payload: schemas.LeaveCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.STUDENT]))
):
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

    leave = models.LeaveRequest(
        user_id=current_user.user_id,
        reason=payload.reason,
        destination=payload.destination,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status="Pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave

@router.get("/leaves", response_model=List[schemas.LeaveResponse])
def list_leaves(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.LeaveRequest).options(joinedload(models.LeaveRequest.student))
    if current_user.role == models.RoleEnum.STUDENT:
        query = query.filter(models.LeaveRequest.user_id == current_user.user_id)
    return query.order_by(models.LeaveRequest.created_at.desc()).all()

@router.patch("/leaves/{leave_id}", response_model=schemas.LeaveResponse)
def update_leave_status(
    leave_id: int,
    payload: schemas.LeaveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.leave_id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave.status = payload.status
    leave.warden_comment = payload.warden_comment
    db.commit()
    db.refresh(leave)
    return leave

# --- NOTICES & NOTIFICATIONS ---
@router.post("/notices", response_model=schemas.NoticeResponse, status_code=status.HTTP_201_CREATED)
def create_notice(
    payload: schemas.NoticeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    notice = models.Notice(
        title=payload.title,
        message=payload.message,
        type=payload.type,
        target_role=payload.target_role,
        status="Published"
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)
    return notice

@router.get("/notices", response_model=List[schemas.NoticeResponse])
def list_notices(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.Notice)
    if current_user.role == models.RoleEnum.STUDENT:
        query = query.filter(models.Notice.target_role.in_(["All", "Student"]))
    return query.order_by(models.Notice.sent_at.desc()).all()

@router.delete("/notices/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notice(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.WARDEN, models.RoleEnum.ADMIN]))
):
    notice = db.query(models.Notice).filter(models.Notice.notification_id == notification_id).first()
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    db.delete(notice)
    db.commit()
