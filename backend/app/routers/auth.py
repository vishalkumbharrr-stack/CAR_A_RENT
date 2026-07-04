from fastapi import APIRouter, HTTPException, Depends
from app.database import supabase, supabase_admin
from app.models.user import UserCreate, UserOut
from app.utils.auth_utils import get_current_user
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(user: UserCreate):
    fake_email = f"user_{user.phone}@carrental.local"
    role = user.role if user.role in ['customer', 'admin'] else 'customer'

    try:
        existing = supabase.table("users").select("id").eq("phone", user.phone).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Phone number already registered")

        auth_response = supabase_admin.auth.admin.create_user({
            "email": fake_email,
            "password": user.password,
            "email_confirm": True,
        })
        user_id = auth_response.user.id

        supabase.table("users").insert({
            "id": user_id,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": role           
        }).execute()

        return {
            "message": "User created successfully",
            "user_id": user_id,
            "login_phone": user.phone,
            "role": role
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")

@router.post("/login")
async def login_by_phone(phone: str, password: str):
    fake_email = f"user_{phone}@carrental.local"
    try:
        res = supabase.auth.sign_in_with_password({
            "email": fake_email,
            "password": password
        })
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "user": {
                "id": res.user.id,
                "email": res.user.email
            }
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    return UserOut(
        id=user["id"],
        email=user.get("email", ""),
        full_name=user.get("full_name", ""),
        phone=user.get("phone"),
        role=user.get("role", "customer")
    )