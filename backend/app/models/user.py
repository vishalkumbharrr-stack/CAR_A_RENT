from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    full_name: str
    phone: str
    password: str
    role: Optional[str] = 'customer'

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    # 👇 New fields
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    aadhaar_number: Optional[str] = None
    dl_number: Optional[str] = None
    dl_expiry: Optional[str] = None
    aadhaar_image_url: Optional[str] = None
    dl_image_url: Optional[str] = None