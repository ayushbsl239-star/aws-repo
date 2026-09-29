"""
Structured CloudWatch logger for AI Adaptive Interview Coach.
Produces JSON-formatted logs with correlation IDs, latency tracking, and sanitization.
Ensures sensitive PII/tokens are never logged.
"""
import json
import logging
import os
import sys
import time
from typing import Any, Dict, Optional

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

class StructuredLogger:
    def __init__(self, name: str = "interview_coach"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, LOG_LEVEL, logging.INFO))
        
        # Ensure single handler
        if not self.logger.handlers:
            handler = logging.StreamHandler(sys.stdout)
            handler.setFormatter(logging.Formatter("%(message)s"))
            self.logger.addHandler(handler)
        self.logger.propagate = False

    def _sanitize(self, data: Any) -> Any:
        """Strip sensitive fields before logging."""
        sensitive_keys = {
            "password", "token", "authorization", "jwt", "secret",
            "access_key", "secret_key", "refresh_token", "resume_text", "id_token"
        }
        if isinstance(data, dict):
            sanitized = {}
            for k, v in data.items():
                if k.lower() in sensitive_keys:
                    sanitized[k] = "[REDACTED]"
                elif isinstance(v, (dict, list)):
                    sanitized[k] = self._sanitize(v)
                else:
                    sanitized[k] = v
            return sanitized
        elif isinstance(data, list):
            return [self._sanitize(item) for item in data]
        return data

    def log(
        self,
        level: str,
        message: str,
        operation: Optional[str] = None,
        request_id: Optional[str] = None,
        interview_id: Optional[str] = None,
        latency_ms: Optional[float] = None,
        bedrock_latency_ms: Optional[float] = None,
        success: Optional[bool] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        payload: Dict[str, Any] = {
            "timestamp": time.time(),
            "level": level.upper(),
            "message": message,
        }
        if operation:
            payload["operation"] = operation
        if request_id:
            payload["requestId"] = request_id
        if interview_id:
            payload["interviewId"] = interview_id
        if latency_ms is not None:
            payload["latencyMs"] = round(latency_ms, 2)
        if bedrock_latency_ms is not None:
            payload["bedrockLatencyMs"] = round(bedrock_latency_ms, 2)
        if success is not None:
            payload["success"] = success
        if extra:
            payload["extra"] = self._sanitize(extra)

        log_fn = getattr(self.logger, level.lower(), self.logger.info)
        log_fn(json.dumps(payload))

    def info(self, message: str, **kwargs):
        self.log("info", message, **kwargs)

    def warning(self, message: str, **kwargs):
        self.log("warning", message, **kwargs)

    def error(self, message: str, **kwargs):
        self.log("error", message, **kwargs)

    def debug(self, message: str, **kwargs):
        self.log("debug", message, **kwargs)


logger = StructuredLogger()
