from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import supabase
from app.utils.auth_utils import get_current_user
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["admin"])

# Middleware to ensure admin access
async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/bookings")
async def all_bookings(
    status: str = Query(None),
    user: dict = Depends(require_admin)
):
    # Step 1: Get car IDs belonging to this dealer
    cars_res = supabase.table("cars").select("id").eq("dealer_id", user["id"]).execute()
    car_ids = [c["id"] for c in cars_res.data] if cars_res.data else []

    if not car_ids:
        return []  # no cars, no bookings

    # Step 2: Filter bookings by those car IDs
    query = supabase.table("bookings").select("*, cars(name, rental_type), users(*)") \
    .in_("car_id", car_ids)
    if status:
        query = query.eq("status", status)
    res = query.order("created_at", desc=True).execute()
    return res.data

@router.get("/revenue")
async def revenue_report(user: dict = Depends(require_admin)):
    # Get car IDs of dealer
    cars_res = supabase.table("cars").select("id").eq("dealer_id", user["id"]).execute()
    car_ids = [c["id"] for c in cars_res.data] if cars_res.data else []

    if not car_ids:
        return {"total_revenue": 0, "online_revenue": 0, "offline_revenue": 0, "total_bookings": 0}

    payments = supabase.table("payments").select("*") \
        .in_("booking_id", supabase.table("bookings").select("id").in_("car_id", car_ids)) \
        .eq("payment_status", "paid").execute()
    # Ye direct nahi chalega, isliye simple loop karte hain:
    # (use python)
    bookings = supabase.table("bookings").select("id").in_("car_id", car_ids).execute()
    booking_ids = [b["id"] for b in bookings.data]
    if not booking_ids:
        return {"total_revenue": 0, "online_revenue": 0, "offline_revenue": 0, "total_bookings": 0}

    payments = supabase.table("payments").select("*") \
        .in_("booking_id", booking_ids) \
        .eq("payment_status", "paid").execute()

    online_total = sum(p["amount"] for p in payments.data if p["payment_mode"] == "online")
    offline_total = sum(p["amount"] for p in payments.data if p["payment_mode"] == "offline")
    return {
        "total_revenue": online_total + offline_total,
        "online_revenue": online_total,
        "offline_revenue": offline_total,
        "total_bookings": len(payments.data)
    }

@router.get("/cars")
async def admin_cars(user: dict = Depends(require_admin)):
    # sirf apni cars dikhein (dealer_id se filter)
    res = supabase.table("cars").select("*").eq("dealer_id", user["id"]).execute()
    return res.data