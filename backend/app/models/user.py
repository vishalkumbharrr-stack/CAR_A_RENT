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