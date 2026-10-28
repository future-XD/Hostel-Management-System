from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .database import Base

class RoleEnum(str, enum.Enum):
    STUDENT = "Student"
    WARDEN = "Warden"
    ADMIN = "Admin"

class RoomStatusEnum(str, enum.Enum):
    AVAILABLE = "Available"
    FULL = "Full"
    MAINTENANCE = "Maintenance"

class AllocationStatusEnum(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ACTIVE = "Active"
    VACATED = "Vacated"

# D1: User Data
class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    registration_no = Column(String(50), unique=True, nullable=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.STUDENT, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    allocations = relationship("Allocation", back_populates="student")
    waitlist_entries = relationship("Waitlist", back_populates="student")
    fee_payments = relationship("FeePayment", back_populates="student")
    complaints = relationship("ComplaintInspection", back_populates="student")
    leave_requests = relationship("LeaveRequest", back_populates="student")

# D2: Room Inventory Data
class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(20), unique=True, index=True, nullable=False)
    block = Column(String(20), nullable=False, default="Block A")
    type = Column(String(50), nullable=False)  # Single, Double, Triple
    capacity = Column(Integer, nullable=False, default=2)
    current_occupancy = Column(Integer, nullable=False, default=0)
    fee_per_semester = Column(Numeric(10, 2), nullable=False, default=25000.00)
    status = Column(Enum(RoomStatusEnum), default=RoomStatusEnum.AVAILABLE, nullable=False)

    allocations = relationship("Allocation", back_populates="room")
    inspections = relationship("ComplaintInspection", back_populates="room")

# D3: Accommodation Application & Booking Data
class Allocation(Base):
    __tablename__ = "allocations"

    booking_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id", ondelete="SET NULL"), nullable=True)
    academic_year = Column(String(20), nullable=False, default="2026-2027")
    semester = Column(String(20), nullable=False, default="Fall 2026")
    preferred_room_type = Column(String(50), nullable=False, default="Double")
    check_in_date = Column(Date, nullable=True)
    check_out_date = Column(Date, nullable=True)
    status = Column(Enum(AllocationStatusEnum), default=AllocationStatusEnum.PENDING, nullable=False)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="allocations")
    room = relationship("Room", back_populates="allocations")
    payments = relationship("FeePayment", back_populates="allocation")

# D3 Extension: Waitlist (From ER Diagram)
class Waitlist(Base):
    __tablename__ = "waitlists"

    waitlist_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    preferred_room_type = Column(String(50), nullable=False)
    position = Column(Integer, nullable=False)
    status = Column(String(30), default="Waiting")  # Waiting, Promoted, Cancelled
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="waitlist_entries")

# D4: Fee Payment Data
class FeePayment(Base):
    __tablename__ = "fee_payments"

    payment_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(Integer, ForeignKey("allocations.booking_id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), default="UPI / Online")
    receipt_number = Column(String(50), unique=True, index=True, nullable=False)
    status = Column(String(30), default="Paid")  # Pending, Paid, Overdue
    paid_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="fee_payments")
    allocation = relationship("Allocation", back_populates="payments")

# D5: Complaint & Room Inspection Log (Merged ER Inspection Log + DFD Complaints)
class ComplaintInspection(Base):
    __tablename__ = "complaints_and_inspections"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id", ondelete="SET NULL"), nullable=True)
    category = Column(String(50), nullable=False)  # Electrical, Plumbing, Furniture, Inspection
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    cleanliness_level = Column(Integer, nullable=True)  # 1-5 scale (filled by Warden)
    damage_severity = Column(Integer, nullable=True)    # 1-5 scale (filled by Warden)
    status = Column(String(30), default="Open")         # Open, In Progress, Resolved, Escalated
    warden_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="complaints")
    room = relationship("Room", back_populates="inspections")

# D5: Visitor Entry Management
class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    visitor_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    visitor_name = Column(String(100), nullable=False)
    relation = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False)
    purpose = Column(String(200), nullable=False)
    check_in_time = Column(DateTime(timezone=True), server_default=func.now())
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    logged_by_warden_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)

# D6: Leave Requests
class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    leave_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text, nullable=False)
    destination = Column(String(150), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(30), default="Pending")  # Pending, Approved, Rejected
    warden_comment = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="leave_requests")

# D6: Notices & Notifications (Merged ER Notification + DFD Notice Board)
class Notice(Base):
    __tablename__ = "notices"

    notification_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="General")  # General, Urgent, Fee Reminder, Event
    target_role = Column(String(30), default="All")  # All, Student, Warden
    recipient_user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=True)
    status = Column(String(30), default="Published")
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
