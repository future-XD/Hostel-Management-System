from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date,datetime
from decimal import Decimal
from .models import RoleEnum, RoomStatusEnum, AllocationStatusEnum
#from .models import AllocationStatusEnum
# --- AUTH & USER SCHEMAS (D1) ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    registration_no: Optional[str] = None
    role: RoleEnum = RoleEnum.STUDENT

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: int
    registration_no: Optional[str]
    name: str
    email: EmailStr
    phone: Optional[str]
    role: RoleEnum
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class RoleUpdate(BaseModel):
    role: RoleEnum

# --- ROOM SCHEMAS (D2) ---
class RoomCreate(BaseModel):
    room_number: str
    block: str = "Block A"
    type: str = "Double"  # Single, Double, Triple
    capacity: int = 2
    fee_per_semester: Decimal = Decimal("25000.00")
    status: RoomStatusEnum = RoomStatusEnum.AVAILABLE

class RoomUpdate(BaseModel):
    block: Optional[str] = None
    type: Optional[str] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    fee_per_semester: Optional[Decimal] = None
    status: Optional[RoomStatusEnum] = None

class RoomResponse(BaseModel):
    room_id: int
    room_number: str
    block: str
    type: str
    capacity: int
    current_occupancy: int
    fee_per_semester: Decimal
    status: RoomStatusEnum

    class Config:
        from_attributes = True

# --- SPRINT 2: ACCOMMODATION & WAITLIST SCHEMAS (D3) ---
class AllocationCreate(BaseModel):
    academic_year: str = "2026-2027"
    semester: str = "Fall 2026"
    preferred_room_type: str = "Double"  # Single, Double, Triple
    check_in_date: Optional[date] = None

class AllocationApprove(BaseModel):
    room_id: int
    check_in_date: Optional[date] = None
    check_out_date: Optional[date] = None

class AllocationResponse(BaseModel):
    booking_id: int
    user_id: int
    room_id: Optional[int]
    academic_year: str
    semester: str
    preferred_room_type: str
    check_in_date: Optional[date]
    check_out_date: Optional[date]
    status: AllocationStatusEnum
    applied_at: datetime
    student: Optional[UserResponse] = None
    room: Optional[RoomResponse] = None

    class Config:
        from_attributes = True

class WaitlistResponse(BaseModel):
    waitlist_id: int
    user_id: int
    preferred_room_type: str
    position: int
    status: str
    joined_at: datetime
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# --- SPRINT 2: FEE PAYMENT SCHEMAS (D4) ---
class FeePaymentPayRequest(BaseModel):
    payment_method: str = "UPI / Online"

class FeePaymentResponse(BaseModel):
    payment_id: int
    user_id: int
    booking_id: Optional[int]
    amount: Decimal
    payment_method: str
    receipt_number: str
    status: str
    paid_at: datetime
    student: Optional[UserResponse] = None
    allocation: Optional[AllocationResponse] = None

    class Config:
        from_attributes = True


# --- SPRINT 3: COMPLAINTS, INSPECTIONS & VISITOR SCHEMAS (D5) ---
class ComplaintCreate(BaseModel):
    room_id: Optional[int] = None
    category: str = "Electrical"  # Electrical, Plumbing, Furniture, Cleaning, Room Inspection
    title: str
    description: str
    cleanliness_level: Optional[int] = None  # 1 to 5
    damage_severity: Optional[int] = None    # 1 to 5

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None             # Open, In Progress, Resolved, Escalated
    cleanliness_level: Optional[int] = None  # 1 to 5
    damage_severity: Optional[int] = None    # 1 to 5
    warden_remarks: Optional[str] = None

class ComplaintResponse(BaseModel):
    log_id: int
    user_id: int
    room_id: Optional[int]
    category: str
    title: str
    description: str
    cleanliness_level: Optional[int]
    damage_severity: Optional[int]
    status: str
    warden_remarks: Optional[str]
    created_at: datetime
    student: Optional[UserResponse] = None
    room: Optional[RoomResponse] = None

    class Config:
        from_attributes = True

class VisitorCreate(BaseModel):
    student_id: int
    visitor_name: str
    relation: str
    phone: str
    purpose: str

class VisitorResponse(BaseModel):
    visitor_id: int
    student_id: int
    visitor_name: str
    relation: str
    phone: str
    purpose: str
    check_in_time: datetime
    check_out_time: Optional[datetime]
    logged_by_warden_id: Optional[int]

    class Config:
        from_attributes = True

# --- SPRINT 4: LEAVE REQUESTS & NOTICES SCHEMAS (D6) ---
class LeaveCreate(BaseModel):
    reason: str
    destination: str
    start_date: date
    end_date: date

class LeaveStatusUpdate(BaseModel):
    status: str  # Approved, Rejected
    warden_comment: Optional[str] = None

class LeaveResponse(BaseModel):
    leave_id: int
    user_id: int
    reason: str
    destination: str
    start_date: date
    end_date: date
    status: str
    warden_comment: Optional[str]
    created_at: datetime
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class NoticeCreate(BaseModel):
    title: str
    message: str
    type: str = "General"       # General, Urgent, Fee Reminder, Event
    target_role: str = "All"    # All, Student, Warden

class NoticeResponse(BaseModel):
    notification_id: int
    title: str
    message: str
    type: str
    target_role: str
    status: str
    sent_at: datetime

    class Config:
        from_attributes = True

AllocationResponse.model_rebuild()
