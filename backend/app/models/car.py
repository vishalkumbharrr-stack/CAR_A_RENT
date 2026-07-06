from pydantic import BaseModel
from typing import Optional

class CarBase(BaseModel):
    name: str
    brand: str
    category: str
    rental_type: Optional[str] = 'local'
    price_per_day: float
    location: str
    available: bool = True

class CarCreate(CarBase):
    pass

class CarOut(CarBase):
    id: str
    image_url: Optional[str] = None                                                 