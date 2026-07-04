from pydantic import BaseModel
from datetime import date
from typing import Optional

class BookingCreate(BaseModel):
    car_id: str
    start_date: date
    end_date: date

class BookingOut(BaseModel):
    id: str
    user_id: str
    car_id: str
    start_date: date
    end_date: date
    total_amount: float
    status: str