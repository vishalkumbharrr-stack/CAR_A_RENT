from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import supabase, supabase_admin
from app.utils.auth_utils import get_current_user
import os
import razorpay
from app.websocket.live_updates import manager
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["payments"])


# Online payment – Razorpay order create
@router.post("/online/create-order")
async def create_razorpay_order(
    booking_id: str = Query(...),
    user: dict = Depends(get_current_user)
):
    booking = supabase.table("bookings").select("id, total_amount, user_id") \
        .eq("id", booking_id).single().execute()
    if not booking.data or booking.data["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.data.get("status") not in ["pending"]:
        raise HTTPException(status_code=400, detail="Booking is not pending")

    client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))
    amount_in_paise = int(booking.data["total_amount"] * 100)
    order = client.order.create({
        "amount": amount_in_paise,
        "currency": "INR",
        "payment_capture": 1
    })
    # Use admin client to insert payment
    supabase_admin.table("payments").insert({
        "booking_id": booking_id,
        "payment_mode": "online",
        "payment_status": "pending",
        "amount": booking.data["total_amount"],
        "transaction_id": order["id"]
    }).execute()
    return {"order_id": order["id"], "amount": amount_in_paise, "currency": "INR"}


@router.post("/online/verify")
async def verify_razorpay_payment(
    booking_id: str = Query(...),
    razorpay_order_id: str = Query(...),
    razorpay_payment_id: str = Query(...),
    razorpay_signature: str = Query(...)
):
    client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))
    params = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    if client.utility.verify_payment_signature(params):
        # Update payment status
        supabase_admin.table("payments").update({
            "payment_status": "paid",
            "paid_at": datetime.utcnow().isoformat()
        }).eq("booking_id", booking_id).eq("transaction_id", razorpay_order_id).execute()
        # Update booking status to confirmed
        supabase_admin.table("bookings").update({"status": "confirmed"}).eq("id", booking_id).execute()
        await manager.broadcast({"type": "booking_update", "booking_id": booking_id, "status": "confirmed"})
        return {"status": "success", "message": "Payment verified"}
    else:
        supabase_admin.table("payments").update({"payment_status": "failed"}).eq("booking_id", booking_id).execute()
        raise HTTPException(status_code=400, detail="Payment verification failed")


# Customer initiates offline payment (cash on pickup)
@router.post("/offline/initiate")
async def initiate_offline_payment(
    booking_id: str = Query(...),
    user: dict = Depends(get_current_user)
):
    """Customer selects cash on pickup – creates a pending offline payment."""
    booking = supabase.table("bookings").select("id, total_amount, user_id") \
        .eq("id", booking_id).single().execute()
    if not booking.data or booking.data["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Booking not found or not yours")

    # Check if a payment already exists
    existing = supabase.table("payments").select("id").eq("booking_id", booking_id).execute()
    if existing.data:
        return {"message": "Offline payment already initiated"}

    # Insert pending offline payment
    supabase_admin.table("payments").insert({
        "booking_id": booking_id,
        "payment_mode": "offline",
        "payment_status": "pending",
        "amount": booking.data["total_amount"]
    }).execute()

    await manager.broadcast({"type": "booking_update", "booking_id": booking_id, "status": "pending"})
    return {"message": "Offline payment initiated. Pay at pickup."}


# Admin confirms offline payment
@router.post("/offline/confirm")
async def confirm_offline_payment(
    booking_id: str = Query(...),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    payment = supabase.table("payments").select("*") \
        .eq("booking_id", booking_id).eq("payment_mode", "offline").single().execute()
    if not payment.data:
        booking = supabase.table("bookings").select("total_amount").eq("id", booking_id).single().execute()
        if not booking.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        supabase_admin.table("payments").insert({
            "booking_id": booking_id,
            "payment_mode": "offline",
            "payment_status": "paid",
            "amount": booking.data["total_amount"],
            "paid_at": datetime.utcnow().isoformat()
        }).execute()
    else:
        supabase_admin.table("payments").update({
            "payment_status": "paid",
            "paid_at": datetime.utcnow().isoformat()
        }).eq("id", payment.data["id"]).execute()

    supabase_admin.table("bookings").update({"status": "confirmed"}).eq("id", booking_id).execute()
    await manager.broadcast({"type": "booking_update", "booking_id": booking_id, "status": "confirmed"})
    return {"message": "Offline payment confirmed"}