from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.database import supabase, supabase_admin
from app.utils.auth_utils import get_current_user
from typing import Optional
import uuid
from app.utils.auth_utils import get_current_user, require_admin


router = APIRouter(prefix="/cars", tags=["cars"])


@router.get("")
async def list_cars(
    category: Optional[str] = None,
    location: Optional[str] = None,
    rental_type: Optional[str] = None
):
    query = supabase.table("cars").select("*").eq("available", True)
    if category:
        query = query.eq("category", category)
    if location:
        query = query.ilike("location", f"%{location}%")
    if rental_type:
        query = query.eq("rental_type", rental_type)
    res = query.execute()
    return res.data


@router.get("/{car_id}")
async def get_car(car_id: str):
    res = supabase.table("cars").select("*").eq("id", car_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Car not found")
    return res.data


@router.post("")
async def add_car(
    name: str = Form(...),
    brand: str = Form(...),
    category: str = Form(...),
    rental_type: str = Form('local'),
    price_per_day: float = Form(...),
    location: str = Form(...),
    image: UploadFile = File(None),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    image_url = None
    if image:
        ext = image.filename.split(".")[-1] if "." in image.filename else "jpg"
        filename = f"{uuid.uuid4()}.{ext}"
        supabase_admin.storage.from_("car-images").upload(
            path=filename,
            file=image.file.read(),
            file_options={"content-type": image.content_type}
        )
        image_url = supabase_admin.storage.from_("car-images").get_public_url(filename)

    car_data = {
        "name": name,
        "brand": brand,
        "category": category,
        "rental_type": rental_type,
        "price_per_day": price_per_day,
        "location": location,
        "image_url": image_url,
        "dealer_id": user["id"],
        "available": True,
    }
    res = supabase_admin.table("cars").insert(car_data).execute()
    return res.data[0]


@router.put("/{car_id}")
async def update_car(
    car_id: str,
    name: str = Form(None),
    brand: str = Form(None),
    category: str = Form(None),
    rental_type: str = Form(None),
    price_per_day: float = Form(None),
    location: str = Form(None),
    available: bool = Form(None),
    image: UploadFile = File(None),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    car = supabase_admin.table("cars").select("*").eq("id", car_id).single().execute()
    if not car.data:
        raise HTTPException(status_code=404, detail="Car not found")

    update_data = {}
    if name is not None: update_data["name"] = name
    if brand is not None: update_data["brand"] = brand
    if category is not None: update_data["category"] = category
    if rental_type is not None: update_data["rental_type"] = rental_type
    if price_per_day is not None: update_data["price_per_day"] = price_per_day
    if location is not None: update_data["location"] = location
    if available is not None: update_data["available"] = available

    if image:
        ext = image.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{ext}"
        supabase_admin.storage.from_("car-images").upload(
            path=filename,
            file=image.file.read(),
            file_options={"content-type": image.content_type}
        )
        update_data["image_url"] = supabase_admin.storage.from_("car-images").get_public_url(filename)

    supabase_admin.table("cars").update(update_data).eq("id", car_id).execute()
    updated = supabase_admin.table("cars").select("*").eq("id", car_id).single().execute()
    return updated.data


@router.delete("/{car_id}")
async def delete_car(car_id: str, user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    supabase_admin.table("cars").delete().eq("id", car_id).execute()
    return {"message": "Car deleted"}


@router.get("/admin/cars")
async def admin_cars(user: dict = Depends(require_admin)):
    res = supabase.table("cars").select("*").eq("dealer_id", user["id"]).execute()
    return res.data