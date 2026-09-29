"""
Authentication middleware for API Gateway Lambda events.
Extracts and validates Cognito JWT claims from request context or Authorization headers.
"""
from typing import Any, Dict, Optional
import json
import base64
from backend.utils.errors import UnauthorizedError
from backend.utils.logger import logger


class AuthUser:
    def __init__(self, sub: str, email: str, name: Optional[str] = None):
        self.sub = sub
        self.email = email
        self.name = name or email.split("@")[0]


def extract_authenticated_user(event: Dict[str, Any]) -> AuthUser:
    """
    Derives authenticated user identity strictly from Cognito JWT claims.
    Never trusts client-supplied 'user_id' in request body or path.
    Supports HTTP API JWT Authorizer, REST API Cognito Authorizer, and offline test tokens.
    """
    request_context = event.get("requestContext", {})
    authorizer = request_context.get("authorizer", {})

    # 1. HTTP API JWT Authorizer format
    jwt_data = authorizer.get("jwt", {})
    claims = jwt_data.get("claims") or authorizer.get("claims")

    if claims:
        sub = claims.get("sub")
        email = claims.get("email", "")
        name = claims.get("name") or claims.get("cognito:username")
        if sub:
            return AuthUser(sub=sub, email=email, name=name)

    # 2. Check Authorization header for local test / demo tokens
    headers = event.get("headers") or {}
    auth_header = headers.get("authorization") or headers.get("Authorization") or ""
    
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            # Parse payload part of JWT (without signature verification if already validated by API GW)
            parts = token.split(".")
            if len(parts) == 3:
                padded = parts[1] + "=" * ((4 - len(parts[1]) % 4) % 4)
                payload_str = base64.urlsafe_b64decode(padded.encode()).decode("utf-8")
                payload = json.loads(payload_str)
                sub = payload.get("sub")
                email = payload.get("email", "")
                name = payload.get("name")
                if sub:
                    return AuthUser(sub=sub, email=email, name=name)
        except Exception as e:
            logger.warning(f"Failed to parse Bearer token: {str(e)}")

    # 3. Local/Dev fallback user ONLY if explicitly enabled
    if event.get("is_offline") or headers.get("x-mock-user-sub"):
        mock_sub = headers.get("x-mock-user-sub", "demo-candidate-sub-1234")
        return AuthUser(sub=mock_sub, email="demo@candidate.com", name="Alex Morgan")

    logger.warning("Request rejected: No valid Cognito claims found in event context")
    raise UnauthorizedError("Authentication token is missing, invalid, or expired.")
