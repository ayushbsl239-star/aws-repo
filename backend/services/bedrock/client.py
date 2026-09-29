"""
Amazon Bedrock client using Bedrock Runtime Converse API.
Includes model ID configuration, guardrail support, exponential backoff, latency metrics,
and controlled repair retries for structured outputs.
"""
import json
import os
import time
from typing import Any, Dict, List, Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from backend.models.evaluation import (
    EvaluationOutput,
    JobDescriptionAnalysis,
    QuestionGenerationOutput,
    ResumeAnalysis,
)
from backend.services.bedrock.prompts import (
    SYSTEM_ANSWER_EVALUATION,
    SYSTEM_FOLLOWUP_GENERATION,
    SYSTEM_JD_ANALYSIS,
    SYSTEM_QUESTION_GENERATION,
    SYSTEM_REPORT_GENERATION,
    SYSTEM_RESUME_ANALYSIS,
    build_evaluation_prompt,
    build_question_prompt,
)
from backend.services.bedrock.validator import validate_and_parse_llm_response
from backend.utils.errors import BedrockError
from backend.utils.logger import logger

DEFAULT_MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"


class BedrockConverseClient:
    def __init__(self):
        self.region = os.environ.get("AWS_REGION", "us-east-1")
        self.model_id = os.environ.get("BEDROCK_MODEL_ID", DEFAULT_MODEL_ID)
        self.guardrail_id = os.environ.get("BEDROCK_GUARDRAIL_ID")
        self.guardrail_version = os.environ.get("BEDROCK_GUARDRAIL_VERSION", "DRAFT")

        # Boto3 client with custom retry config
        boto_config = Config(
            region_name=self.region,
            retries={"max_attempts": 3, "mode": "adaptive"},
            connect_timeout=10,
            read_timeout=60,
        )
        self.client = boto3.client("bedrock-runtime", config=boto_config)

    def _call_converse(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
        max_tokens: int = 2048,
        operation: str = "bedrock_converse",
    ) -> str:
        """
        Executes a call to bedrock_runtime.converse with latency measurement and error handling.
        """
        system_block = [{"text": system_prompt}]
        messages = [
            {
                "role": "user",
                "content": [{"text": user_message}],
            }
        ]

        kwargs: Dict[str, Any] = {
            "modelId": self.model_id,
            "messages": messages,
            "system": system_block,
            "inferenceConfig": {
                "temperature": temperature,
                "maxTokens": max_tokens,
                "topP": 0.9,
            },
        }

        # Apply Bedrock Guardrail if configured
        if self.guardrail_id:
            kwargs["guardrailConfig"] = {
                "guardrailIdentifier": self.guardrail_id,
                "guardrailVersion": self.guardrail_version,
                "trace": "disabled",
            }

        start_time = time.time()
        for attempt in range(1, 4):
            try:
                response = self.client.converse(**kwargs)
                latency_ms = (time.time() - start_time) * 1000

                output_message = response.get("output", {}).get("message", {})
                content_blocks = output_message.get("content", [])
                full_text = "".join(b.get("text", "") for b in content_blocks)

                logger.info(
                    "Bedrock converse completed successfully",
                    operation=operation,
                    bedrock_latency_ms=latency_ms,
                    success=True,
                    extra={"attempt": attempt, "model": self.model_id},
                )
                return full_text

            except ClientError as ce:
                code = ce.response.get("Error", {}).get("Code", "Unknown")
                msg = ce.response.get("Error", {}).get("Message", str(ce))
                logger.warning(
                    f"Bedrock converse error on attempt {attempt}: {code} - {msg}",
                    operation=operation,
                    extra={"attempt": attempt, "code": code},
                )
                if code in ("ThrottlingException", "RequestLimitExceeded", "ServiceUnavailable"):
                    time.sleep(2**attempt * 0.5)
                    continue
                raise BedrockError(f"Bedrock service error: {code}")
            except Exception as e:
                logger.error(
                    f"Unexpected exception calling Bedrock: {str(e)}",
                    operation=operation,
                    extra={"attempt": attempt},
                )
                if attempt < 3:
                    time.sleep(1.0)
                    continue
                raise BedrockError("Failed to communicate with AI model.")

        raise BedrockError("AI service unavailable after retries.")

    def generate_question(
        self,
        role: str,
        experience: str,
        interview_type: str,
        target_competency: str,
        difficulty: int,
        questions_already_asked: List[str],
        current_skill_profile: Dict[str, float],
        jd_context: Optional[Dict[str, Any]] = None,
        resume_context: Optional[Dict[str, Any]] = None,
    ) -> QuestionGenerationOutput:
        """Generates an adaptive question with schema validation and one controlled repair retry."""
        user_prompt = build_question_prompt(
            role=role,
            experience=experience,
            interview_type=interview_type,
            target_competency=target_competency,
            difficulty=difficulty,
            questions_already_asked=questions_already_asked,
            current_skill_profile=current_skill_profile,
            jd_context=jd_context,
            resume_context=resume_context,
        )

        raw = self._call_converse(
            system_prompt=SYSTEM_QUESTION_GENERATION,
            user_message=user_prompt,
            temperature=0.4,
            operation="generate_question",
        )

        try:
            return validate_and_parse_llm_response(
                raw, QuestionGenerationOutput, "generate_question_validation"
            )
        except BedrockError:
            # Controlled repair retry
            logger.info("Attempting controlled repair for question generation")
            repair_prompt = f"The previous output was invalid JSON. Reformat into strict valid JSON only:\n{raw}"
            repaired_raw = self._call_converse(
                system_prompt="Output ONLY valid JSON matching schema: {question, skill, difficulty, question_type, expected_concepts, reason_for_selection}",
                user_message=repair_prompt,
                temperature=0.1,
                operation="repair_question",
            )
            return validate_and_parse_llm_response(
                repaired_raw, QuestionGenerationOutput, "repair_question_validation"
            )

    def evaluate_answer(
        self,
        role: str,
        experience: str,
        question: str,
        skill: str,
        difficulty: int,
        expected_concepts: List[str],
        candidate_answer: str,
        interview_type: str = "technical",
    ) -> EvaluationOutput:
        """Evaluates candidate response and calculates server-side weighted score."""
        user_prompt = build_evaluation_prompt(
            role=role,
            experience=experience,
            question=question,
            skill=skill,
            difficulty=difficulty,
            expected_concepts=expected_concepts,
            candidate_answer=candidate_answer,
        )

        raw = self._call_converse(
            system_prompt=SYSTEM_ANSWER_EVALUATION,
            user_message=user_prompt,
            temperature=0.1,
            operation="evaluate_answer",
        )

        try:
            eval_output = validate_and_parse_llm_response(
                raw, EvaluationOutput, "evaluate_answer_validation"
            )
        except BedrockError:
            # Controlled repair retry
            logger.info("Attempting controlled repair for answer evaluation")
            repair_prompt = f"The previous evaluation was not valid JSON. Return strictly valid JSON adhering to schema:\n{raw}"
            repaired_raw = self._call_converse(
                system_prompt="Return ONLY valid JSON matching evaluation schema with technical_accuracy, relevance, completeness, communication, problem_solving, strengths, weaknesses, missing_concepts, skills_demonstrated, recommended_focus_skill, follow_up_warranted, follow_up_reason, confidence",
                user_message=repair_prompt,
                temperature=0.0,
                operation="repair_evaluation",
            )
            eval_output = validate_and_parse_llm_response(
                repaired_raw, EvaluationOutput, "repair_evaluation_validation"
            )

        # Server-side calculation of overall score (never trust raw LLM overall score)
        eval_output.calculate_weighted_overall_score(interview_type=interview_type)
        return eval_output

    def generate_follow_up(
        self,
        role: str,
        previous_question: str,
        candidate_answer: str,
        follow_up_reason: str,
        skill: str,
        difficulty: int,
    ) -> QuestionGenerationOutput:
        """Generates a targeted follow-up question directly addressing an answer gap or claim."""
        user_prompt = f"""Role: {role}
Previous Question: {previous_question}
Candidate's Answer: \"\"\"{candidate_answer}\"\"\"
Follow-up Reason: {follow_up_reason}
Target Skill: {skill}
Difficulty: {difficulty}

Generate ONE focused follow-up question."""

        raw = self._call_converse(
            system_prompt=SYSTEM_FOLLOWUP_GENERATION,
            user_message=user_prompt,
            temperature=0.3,
            operation="generate_follow_up",
        )

        return validate_and_parse_llm_response(
            raw, QuestionGenerationOutput, "generate_follow_up_validation"
        )

    def analyze_job_description(self, jd_text: str) -> JobDescriptionAnalysis:
        """Extracts structured competency map from Job Description."""
        raw = self._call_converse(
            system_prompt=SYSTEM_JD_ANALYSIS,
            user_message=f"Analyze this Job Description:\n\"\"\"{jd_text[:4000]}\"\"\"",
            temperature=0.1,
            operation="analyze_jd",
        )
        return validate_and_parse_llm_response(
            raw, JobDescriptionAnalysis, "analyze_jd_validation"
        )

    def analyze_resume(self, resume_text: str) -> ResumeAnalysis:
        """Extracts candidate claims and projects without demographic assumptions."""
        raw = self._call_converse(
            system_prompt=SYSTEM_RESUME_ANALYSIS,
            user_message=f"Extract candidate skills and projects from this resume:\n\"\"\"{resume_text[:4000]}\"\"\"",
            temperature=0.1,
            operation="analyze_resume",
        )
        return validate_and_parse_llm_response(
            raw, ResumeAnalysis, "analyze_resume_validation"
        )

    def generate_final_report(
        self,
        role: str,
        experience: str,
        readiness_score: float,
        questions_and_evaluations: List[Dict[str, Any]],
        skill_profile: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generates final qualitative coaching report and 7-day personalized improvement plan."""
        context_payload = {
            "role": role,
            "experience": experience,
            "readiness_score": readiness_score,
            "skill_profile": skill_profile,
            "evaluation_history": questions_and_evaluations,
        }

        raw = self._call_converse(
            system_prompt=SYSTEM_REPORT_GENERATION,
            user_message=f"Synthesize comprehensive interview report and 7-day improvement plan:\n{json.dumps(context_payload, indent=2)}",
            temperature=0.3,
            max_tokens=3072,
            operation="generate_final_report",
        )

        parsed = validate_and_parse_llm_response(raw, dict, "report_validation")
        return parsed
