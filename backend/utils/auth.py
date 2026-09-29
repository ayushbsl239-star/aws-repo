import time
from typing import Optional, Dict, Any
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
import jwt

SECRET_KEY = "local_ai_interview_coach_jwt_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 86400 * 7  # 7 days token validity

ph = PasswordHasher()

def hash_password(password: str) -> str:
    """Hash password using Argon2id."""
    return ph.hash(password)

def verify_password(password_hash: str, password: str) -> bool:
    """Verify password against Argon2 hash."""
    try:
        return ph.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, Exception):
        return False

def create_access_token(data: Dict[str, Any], expires_in: int = ACCESS_TOKEN_EXPIRE_SECONDS) -> str:
    """Create signed JWT access token."""
    to_encode = data.copy()
    now = time.time()
    to_encode.update({
        "iat": now,
        "exp": now + expires_in
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        return None
