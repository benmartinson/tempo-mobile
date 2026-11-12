"""
Authentication and credit-checking dependencies for FastAPI routes.

Personal version: there is no sign-in. Every request runs as one fixed user
(LOCAL_USER_ID), and credits are read from the user_credits table via the
Supabase REST API (service role key).
"""

import os

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("EXPO_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Personal version: no sign-in and no JWTs. Every request is treated as one
# fixed user. Only run this backend locally; never deploy this branch.
LOCAL_USER_ID = os.getenv("LOCAL_USER_ID") or "local-user"
print(f"[auth] no sign-in: all requests run as user '{LOCAL_USER_ID}'")

_bearer_scheme = HTTPBearer(auto_error=False)


async def verify_jwt(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    """Return the single local user. No token is required or checked."""
    return LOCAL_USER_ID


async def check_credits(user_id: str = Depends(verify_jwt)) -> str:
    """Verify the user has credits, deduct 1, and return user_id."""
    if not SUPABASE_SERVICE_ROLE_KEY:
        print("SUPABASE_SERVICE_ROLE_KEY is not configured")
        raise HTTPException(status_code=500, detail="Credit check is not configured")

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    try:
        async with httpx.AsyncClient() as client:
            # Fetch current credits
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/user_credits",
                params={"user_id": f"eq.{user_id}", "select": "credits"},
                headers=headers,
            )

            if response.status_code != 200:
                print(f"Credit check failed: {response.status_code} - {response.text}")
                raise HTTPException(status_code=500, detail="Credit check failed")

            rows = response.json()
            if not rows or rows[0].get("credits", 0) <= 0:
                raise HTTPException(status_code=403, detail="Insufficient credits")

            # Deduct 1 credit
            current_credits = rows[0]["credits"]
            deduct_response = await client.patch(
                f"{SUPABASE_URL}/rest/v1/user_credits",
                params={"user_id": f"eq.{user_id}"},
                headers={**headers, "Content-Type": "application/json", "Prefer": "return=minimal"},
                json={"credits": current_credits - 1},
            )

            if deduct_response.status_code not in (200, 204):
                print(f"Credit deduction failed: {deduct_response.status_code} - {deduct_response.text}")
                raise HTTPException(status_code=500, detail="Credit deduction failed")

    except HTTPException:
        raise
    except Exception as e:
        print(f"Credit check error: {e}")
        raise HTTPException(status_code=500, detail="Credit check failed")

    return user_id
