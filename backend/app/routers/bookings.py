from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import supabase, supabase_admin
from app.utils.auth_utils import get_current_user
from datetime import date
from app.websocket.live_updates import manager

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.post("")
async def create_booking(
    car_id: str = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
    user: dict = Depends(get_current_user)
):
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="Invalid date range")

    car = supabase.table("cars").select("*").eq("id", car_id).single().execute()
    if not car.data or not car.data.get("available"):
        raise HTTPException(status_code=400, detail="Car not available")

    overlap = supabase.table("bookings").select("*") \
        .eq("car_id", car_id) \
        .neq("status", "cancelled") \
        .lte("start_date", str(end_date)) \
        .gte("end_date", str(start_date)) \
        .execute()
    if overlap.data:
        raise HTTPException(status_code=409, detail="Car already booked for these dates")

    days = (end_date - start_date).days + 1
    total = days * float(car.data["price_per_day"])

    booking_data = {
        "user_id": user["id"],
        "car_id": car_id,
        "start_date": str(start_date),
        "end_date": str(end_date),
        "total_amount": total,
        "status": "pending"
    }

    res = supabase_admin.table("bookings").insert(booking_data).execute()
    new_booking = res.data[0]

    await manager.broadcast({"type": "new_booking", "booking_id": new_booking["id"]})
    return new_booking


@router.get("/my")
async def my_bookings(user: dict = Depends(get_current_user)):
    res = supabase.table("bookings").select("*, cars(*)") \
        .eq("user_id", user["id"]).order("created_at", desc=True).execute()
    return res.data


@router.get("/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    res = supabase.table("bookings").select("*, cars(*)") \
        .eq("id", booking_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Booking not found")
    return res.data


@router.put("/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    status: str = Query(..., pattern="^(confirmed|ongoing|completed|cancelled)$"),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    supabase_admin.table("bookings").update({"status": status}).eq("id", booking_id).execute()

    await manager.broadcast({
        "type": "booking_update",
        "booking_id": booking_id,
        "status": status
    })
    return {"message": f"Booking {booking_id} updated to {status}"}