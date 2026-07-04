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
    query = supabase.table("bookings").select("*, cars(name), users(full_name, phone)")
    if status:
        query = query.eq("status", status)
    res = query.order("created_at", desc=True).execute()
    return res.data

@router.get("/revenue")
async def revenue_report(user: dict = Depends(require_admin)):
    # Fetch all paid payments
    payments = supabase.table("payments").select("*").eq("payment_status", "paid").execute()
    
    online_total = 0
    offline_total = 0
    for p in payments.data:
        if p["payment_mode"] == "online":
            online_total += float(p["amount"])
        elif p["payment_mode"] == "offline":
            offline_total += float(p["amount"])
    
    return {
        "total_revenue": online_total + offline_total,
        "online_revenue": online_total,
        "offline_revenue": offline_total,
        "total_bookings": len(payments.data)
    }