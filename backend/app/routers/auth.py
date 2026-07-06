from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from app.database import supabase, supabase_admin
from app.models.user import UserCreate, UserOut
from app.utils.auth_utils import get_current_user
from pydantic import BaseModel
import uuid
from typing import Optional

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(
    full_name: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    role: str = Form('customer'),
    # 👇 New KYC fields (optional)
    address: Optional[str] = Form(None),
    aadhaar_number: Optional[str] = Form(None),
    dl_number: Optional[str] = Form(None),
    dl_expiry: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
):
    fake_email = f"user_{phone}@carrental.local"
    if role not in ['customer', 'admin']:
        role = 'customer'

    try:
        existing = supabase.table("users").select("id").eq("phone", phone).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Phone number already registered")

        auth_response = supabase_admin.auth.admin.create_user({
            "email": fake_email,
            "password": password,
            "email_confirm": True,
        })
        user_id = auth_response.user.id

        supabase.table("users").insert({
            "id": user_id,
            "full_name": full_name,
            "phone": phone,
            "role": role,
            "address": address,
            "aadhaar_number": aadhaar_number,
            "dl_number": dl_number,
            "dl_expiry": dl_expiry,
            "emergency_contact": emergency_contact
        }).execute()

        return {
            "message": "User created successfully",
            "user_id": user_id,
            "login_phone": phone,
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
        role=user.get("role", "customer"),
        address=user.get("address"),
        emergency_contact=user.get("emergency_contact"),
        aadhaar_number=user.get("aadhaar_number"),
        dl_number=user.get("dl_number"),
        dl_expiry=user.get("dl_expiry"),
        aadhaar_image_url=user.get("aadhaar_image_url"),
        dl_image_url=user.get("dl_image_url")
    )

@router.put("/profile")
async def update_profile(
    address: Optional[str] = Form(None),
    emergency_contact: Optional[str] = Form(None),
    aadhaar_number: Optional[str] = Form(None),
    dl_number: Optional[str] = Form(None),
    dl_expiry: Optional[str] = Form(None),
    aadhaar_image: Optional[UploadFile] = File(None),
    dl_image: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user)
):
    update_data = {}
    if address is not None: update_data["address"] = address
    if emergency_contact is not None: update_data["emergency_contact"] = emergency_contact
    if aadhaar_number is not None: update_data["aadhaar_number"] = aadhaar_number
    if dl_number is not None: update_data["dl_number"] = dl_number
    if dl_expiry is not None: update_data["dl_expiry"] = dl_expiry

    if aadhaar_image:
        ext = aadhaar_image.filename.split(".")[-1] if "." in aadhaar_image.filename else "jpg"
        filename = f"docs/aadhaar_{user['id']}_{uuid.uuid4()}.{ext}"
        supabase_admin.storage.from_("user-documents").upload(
            path=filename,
            file=aadhaar_image.file.read(),
            file_options={"content-type": aadhaar_image.content_type}
        )
        update_data["aadhaar_image_url"] = supabase_admin.storage.from_("user-documents").get_public_url(filename)

    if dl_image:
        ext = dl_image.filename.split(".")[-1] if "." in dl_image.filename else "jpg"
        filename = f"docs/dl_{user['id']}_{uuid.uuid4()}.{ext}"
        supabase_admin.storage.from_("user-documents").upload(
            path=filename,
            file=dl_image.file.read(),
            file_options={"content-type": dl_image.content_type}
        )
        update_data["dl_image_url"] = supabase_admin.storage.from_("user-documents").get_public_url(filename)

    if update_data:
        supabase_admin.table("users").update(update_data).eq("id", user["id"]).execute()

    profile = supabase.table("users").select("*").eq("id", user["id"]).single().execute()
    return profile.data