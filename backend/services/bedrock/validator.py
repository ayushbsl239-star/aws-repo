"""
Pydantic schema validation, JSON sanitization, and controlled repair logic for Bedrock outputs.
"""
import json
import re
from typing import Any, Dict, Optional, Type, TypeVar
from pydantic import BaseModel, ValidationError
from backend.utils.logger import logger
from backend.utils.errors import BedrockError

T = TypeVar("T", bound=BaseModel)


def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Extracts JSON payload from model output, handling markdown blocks or extraneous commentary.
    """
    text = text.strip()
    
    # 1. Direct parse attempt
    try:
        return json.loads(text)
    except Exception:
        pass

    # 2. Extract from ```json ... ``` or ``` ... ```
    code_block = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if code_block:
        try:
            return json.loads(code_block.group(1).strip())
        except Exception:
            pass

    # 3. Find outermost braces { ... }
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = text[first_brace : last_brace + 1]
        try:
            return json.loads(candidate)
        except Exception:
            pass

    return None


def validate_and_parse_llm_response(
    raw_response: str,
    target_model: Type[T],
    operation_name: str = "llm_validation"
) -> T:
    """
    Validates Bedrock response against a Pydantic model.
    Logs structured validation errors if schema or constraints fail.
    """
    parsed_json = extract_json_from_text(raw_response)
    if not parsed_json:
        logger.error(
            "Failed to extract JSON from Bedrock response",
            operation=operation_name,
            extra={"raw_length": len(raw_response), "snippet": raw_response[:200]}
        )
        raise BedrockError("Invalid format received from AI model.")

    try:
        validated = target_model.model_validate(parsed_json)
        return validated
    except ValidationError as ve:
        logger.error(
            "Bedrock output failed Pydantic schema validation",
            operation=operation_name,
            extra={"validation_errors": ve.errors(), "parsed_json": parsed_json}
        )
        raise BedrockError("AI response did not conform to required evaluation rubric schema.")
