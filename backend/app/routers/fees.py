from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql import func
from typing import List
import uuid
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/fees", tags=["4.0 Fee Payment Management"])

@router.get("/", response_model=List[schemas.FeePaymentResponse])
def list_fees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    query = db.query(models.FeePayment).options(
        joinedload(models.FeePayment.student),
        joinedload(models.FeePayment.allocation).joinedload(models.Allocation.room)
    )
    if current_user.role == models.RoleEnum.STUDENT:
        query = query.filter(models.FeePayment.user_id == current_user.user_id)
    return query.order_by(models.FeePayment.paid_at.desc()).all()

@router.post("/{payment_id}/pay", response_model=schemas.FeePaymentResponse)
def pay_hostel_fee(
    payment_id: int,
    payload: schemas.FeePaymentPayRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    fee = db.query(models.FeePayment).filter(models.FeePayment.payment_id == payment_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")

    if current_user.role == models.RoleEnum.STUDENT and fee.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to pay this invoice")

    if fee.status == "Paid":
        raise HTTPException(status_code=400, detail="This fee invoice is already paid")

    # Generate Official Receipt & Mark Paid
    fee.payment_method = payload.payment_method
    fee.status = "Paid"
    fee.receipt_number = f"RCPT-2026-{uuid.uuid4().hex[:6].upper()}"
    fee.paid_at = func.now()

    # Upgrade linked Allocation status to ACTIVE
    if fee.booking_id:
        allocation = db.query(models.Allocation).filter(models.Allocation.booking_id == fee.booking_id).first()
        if allocation:
            allocation.status = models.AllocationStatusEnum.ACTIVE

    db.commit()
    db.refresh(fee)
    return fee
