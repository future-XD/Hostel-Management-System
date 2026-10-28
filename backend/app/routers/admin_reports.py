from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from .. import models, security
from ..database import get_db

router = APIRouter(prefix="/api/reports", tags=["7.0 System Administration & Reports"])

@router.get("/operational-summary")
def get_system_operational_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.ADMIN, models.RoleEnum.WARDEN]))
):
    # D1: User Breakdown
    users = db.query(models.User).all()
    student_count = sum(1 for u in users if u.role == models.RoleEnum.STUDENT)
    warden_count = sum(1 for u in users if u.role == models.RoleEnum.WARDEN)

    # D2 & D3: Room & Allocation Summaries
    rooms = db.query(models.Room).all()
    total_capacity = sum(r.capacity for r in rooms)
    total_occupied = sum(r.current_occupancy for r in rooms)
    waitlist_count = db.query(models.Waitlist).filter(models.Waitlist.status == "Waiting").count()
    pending_applications = db.query(models.Allocation).filter(
        models.Allocation.status == models.AllocationStatusEnum.PENDING
    ).count()

    # D4: Fee Payment & Revenue Summary
    fees = db.query(models.FeePayment).all()
    total_revenue_collected = sum(float(f.amount) for f in fees if f.status == "Paid")
    total_pending_dues = sum(float(f.amount) for f in fees if f.status == "Pending")

    # D5: Complaints, Unresolved Escalations & Active Visitors
    complaints = db.query(models.ComplaintInspection).options(
        joinedload(models.ComplaintInspection.student),
        joinedload(models.ComplaintInspection.room)
    ).all()
    open_complaints = sum(1 for c in complaints if c.status in ["Open", "In Progress"])
    resolved_complaints = sum(1 for c in complaints if c.status == "Resolved")
    escalated_list = [
        {
            "log_id": c.log_id,
            "title": c.title,
            "category": c.category,
            "room_number": c.room.room_number if c.room else "Unassigned",
            "student_name": c.student.name if c.student else "Unknown",
            "damage_severity": c.damage_severity,
            "warden_remarks": c.warden_remarks,
        }
        for c in complaints if c.status == "Escalated"
    ]
    active_visitors = db.query(models.VisitorLog).filter(models.VisitorLog.check_out_time.is_(None)).count()

    # D6: Pending Leave Requests
    pending_leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "Pending").count()

    return {
        "users": {
            "total_users": len(users),
            "students": student_count,
            "wardens": warden_count,
        },
        "accommodation": {
            "total_rooms": len(rooms),
            "total_capacity": total_capacity,
            "total_occupied": total_occupied,
            "occupancy_rate": round((total_occupied / total_capacity * 100), 1) if total_capacity else 0,
            "active_waitlist": waitlist_count,
            "pending_applications": pending_applications,
        },
        "finance": {
            "revenue_collected": total_revenue_collected,
            "pending_dues": total_pending_dues,
            "paid_invoices": sum(1 for f in fees if f.status == "Paid"),
            "pending_invoices": sum(1 for f in fees if f.status == "Pending"),
        },
        "operations": {
            "open_complaints": open_complaints,
            "resolved_complaints": resolved_complaints,
            "escalated_count": len(escalated_list),
            "unresolved_escalations": escalated_list,
            "active_visitors_inside": active_visitors,
            "pending_leaves": pending_leaves,
        }
    }
