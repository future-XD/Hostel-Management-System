from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from decimal import Decimal
from .database import engine, Base, SessionLocal
from . import models, security


from app.routers import auth, rooms, allocations, fees, operations, leaves_notices, admin_reports

# ... inside main.py where routers are included:

def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(models.User).count() == 0:
            demo_users = [
                models.User(
                    name="System Administrator",
                    email="admin@hostel.edu",
                    phone="9876543210",
                    password_hash=security.get_password_hash("admin123"),
                    role=models.RoleEnum.ADMIN
                ),
                models.User(
                    name="Chief Warden",
                    email="warden@hostel.edu",
                    phone="9876543211",
                    password_hash=security.get_password_hash("warden123"),
                    role=models.RoleEnum.WARDEN
                ),
                models.User(
                    name="Bhavishya Yadav",
                    registration_no="2427010200",
                    email="student@hostel.edu",
                    phone="9876543212",
                    password_hash=security.get_password_hash("student123"),
                    role=models.RoleEnum.STUDENT
                ),
            ]
            db.add_all(demo_users)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    yield

app = FastAPI(
    title="Hostel Management System API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(allocations.router)
app.include_router(fees.router)
app.include_router(operations.router)
app.include_router(leaves_notices.router)
app.include_router(admin_reports.router)
@app.get("/api/health")
def health_check():
    return {"status": "ok", "sprint": "Sprint 0 Complete - DB & Auth Ready"}
