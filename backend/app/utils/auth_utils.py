from fastapi import Header, HTTPException
from app.database import supabase
import traceback
from fastapi import Depends

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    
    try:
        # Supabase se user fetch karo token ke through
        user_res = supabase.auth.get_user(token)
        
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user_res.user.id
        email = user_res.user.email
        
        # Profile humari 'users' table se lo
        profile = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not profile.data:
            # User exists in Auth but not in public.users table
            raise HTTPException(status_code=404, detail="User profile not found")
        
        user_data = profile.data[0]
        user_data["email"] = email
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Auth error: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=401, detail="Token verification failed")
    

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user