from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaymentOut(BaseModel):
    id: str
    booking_id: str
    payment_mode: str
    payment_status: str
    transaction_id: Optional[str] = None
    amount: float
    paid_at: Optional[datetime] = None