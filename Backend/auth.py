import os
import base64
import json
import hmac
import hashlib
import time
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

from database import get_db
from database.models import User

# Load secret key
JWT_SECRET = os.environ.get("JWT_SECRET", "super_secret_tokenlens_jwt_signing_key_change_me_in_prod")

security = HTTPBearer(auto_error=False)

class LoginPayload(BaseModel):
    id_token: str

class ResetPasswordPayload(BaseModel):
    email: str
    new_password: str

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def base64url_decode(data: str) -> bytes:
    data += '=' * (4 - len(data) % 4)
    return base64.urlsafe_b64decode(data.encode('utf-8'))

def create_jwt(payload: dict, secret: str = JWT_SECRET) -> str:
    """Create a cryptographically signed HS256 JWT using standard library."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    
    unsigned_token = f"{base64url_encode(header_json)}.{base64url_encode(payload_json)}"
    signature = hmac.new(secret.encode('utf-8'), unsigned_token.encode('utf-8'), hashlib.sha256).digest()
    
    return f"{unsigned_token}.{base64url_encode(signature)}"

def verify_jwt(token: str, secret: str = JWT_SECRET) -> dict:
    """Verify the signature and expiration of our local JWT."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        unsigned_token = f"{parts[0]}.{parts[1]}"
        expected_sig = base64url_encode(
            hmac.new(secret.encode('utf-8'), unsigned_token.encode('utf-8'), hashlib.sha256).digest()
        )
        
        if not hmac.compare_digest(parts[2], expected_sig):
            return None
        
        payload = json.loads(base64url_decode(parts[1]).decode('utf-8'))
        
        # Check expiration
        if "exp" in payload and payload["exp"] < time.time():
            return None
            
        return payload
    except Exception:
        return None

def decode_jwt_payload_unverified(token: str) -> dict:
    """Safely decode the JSON payload of an unverified JWT (e.g. Firebase ID Token)."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid JWT token format")
        
        payload_bytes = base64url_decode(parts[1])
        return json.loads(payload_bytes.decode('utf-8'))
    except Exception as e:
        raise ValueError(f"Failed to decode token payload: {e}")

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """ FastAPI Dependency to authenticate the user using the local JWT. """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization credentials are required."
        )
        
    token = credentials.credentials
    payload = verify_jwt(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token."
        )
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token does not contain user identifier."
        )
        
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists."
        )
        
    return user
