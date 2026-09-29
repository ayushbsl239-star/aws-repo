"""
Application error definitions and safe response formatters.
Never exposes stack traces, AWS secrets, or internal prompt templates to users.
"""
from typing import Any, Dict, Optional

class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class UnauthorizedError(AppError):
    def __init__(self, message: str = "Authentication required or invalid token."):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401)

class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have permission to access this resource."):
        super().__init__(code="FORBIDDEN", message=message, status_code=403)

class NotFoundError(AppError):
    def __init__(self, message: str = "Requested resource not found."):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)

class ConflictError(AppError):
    def __init__(self, message: str = "Conflict with existing resource state."):
        super().__init__(code="CONFLICT", message=message, status_code=409)

class BedrockError(AppError):
    def __init__(self, message: str = "We couldn't generate the AI response. Please try again."):
        super().__init__(code="BEDROCK_ERROR", message=message, status_code=502)

class ValidationError(AppError):
    def __init__(self, message: str = "Invalid request payload or schema."):
        super().__init__(code="VALIDATION_ERROR", message=message, status_code=422)

class ServiceUnavailableError(AppError):
    def __init__(self, message: str = "Service temporarily unavailable. Please retry shortly."):
        super().__init__(code="SERVICE_UNAVAILABLE", message=message, status_code=503)


def format_error_response(error: Exception) -> Dict[str, Any]:
    """Formats an exception into a safe API Gateway HTTP response payload."""
    if isinstance(error, AppError):
        code = error.code
        message = error.message
        status_code = error.status_code
    else:
        # Generic unhandled exception - hide internals
        code = "INTERNAL_SERVER_ERROR"
        message = "An unexpected error occurred. Please try again."
        status_code = 500

    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token"
        },
        "body": {
            "error": {
                "code": code,
                "message": message
            }
        }
    }
