from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["1.0 User Authentication"])

@router.post("/register", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    if payload.registration_no:
        existing_reg = db.query(models.User).filter(models.User.registration_no == payload.registration_no).first()
        if existing_reg:
            raise HTTPException(status_code=400, detail="Registration number already exists")

    new_user = models.User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        registration_no=payload.registration_no,
        password_hash=security.get_password_hash(payload.password),
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = security.create_access_token(data={"sub": str(new_user.user_id), "role": new_user.role.value})
    return {"access_token": token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not security.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = security.create_access_token(data={"sub": str(user.user_id), "role": user.role.value})
    return {"access_token": token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# Admin Use Case: Manage Users
@router.get("/users", response_model=List[schemas.UserResponse])
def list_all_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.ADMIN, models.RoleEnum.WARDEN]))
):
    return db.query(models.User).order_by(models.User.user_id.asc()).all()

@router.patch("/users/{user_id}/role", response_model=schemas.UserResponse)
def update_user_role(
    user_id: int,
    payload: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.ADMIN]))
):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.require_roles([models.RoleEnum.ADMIN]))
):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active Admin account")
    db.delete(user)
    db.commit()
