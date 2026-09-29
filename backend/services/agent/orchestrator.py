"""
AgentCore Orchestrator for interview decisions.
Selects next interview action using Bedrock Agent reasoning when AGENTIC_MODE=true,
with automatic fallback to the deterministic adaptive engine.
"""
import json
import os
from typing import Dict, List, Optional
import boto3
from botocore.config import Config

from backend.models.evaluation import EvaluationOutput
from backend.models.interview import InterviewModel
from backend.services.adaptive.engine import AdaptiveDecision, AdaptiveEngine
from backend.services.agent.safety import AgentSafetyBoundary
from backend.services.agent.tools import AGENT_TOOL_DEFINITIONS, AgentToolExecutor
from backend.utils.logger import logger


AGENT_SYSTEM_PROMPT = """You are the interview orchestration agent.
Your objective is to run a fair, useful, role-relevant adaptive interview.
You are NOT responsible for hiring decisions.
Use the candidate's answer evaluations and job competency map to decide what should happen next.
Prefer collecting sufficient evidence across important job competencies.
Do not over-focus on one skill unless weakness or depth requires it.
Use follow-ups when the previous answer contains an important claim that needs clarification or deeper reasoning.
Do not ask protected-characteristic questions.
Respect the configured question limit.
Do not repeat questions.
Do not exceed allowed difficulty range (1 to 5, max 1 level jump).

You must call the 'propose_next_action' tool with your reasoned proposal."""


class AgentOrchestrator:
    def __init__(self, adaptive_engine: Optional[AdaptiveEngine] = None):
        self.adaptive_engine = adaptive_engine or AdaptiveEngine()
        self.agentic_mode = os.environ.get("AGENTIC_MODE", "false").lower() == "true"
        self.region = os.environ.get("AWS_REGION", "us-east-1")
        self.model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")
        
        boto_config = Config(region_name=self.region, retries={"max_attempts": 2})
        self.bedrock_client = boto3.client("bedrock-runtime", config=boto_config)

    def decide_next_action(
        self,
        interview: InterviewModel,
        user_sub: str,
        latest_evaluation: EvaluationOutput,
    ) -> AdaptiveDecision:
        """
        Orchestrates next interview action.
        If AGENTIC_MODE is disabled or an error occurs, falls back cleanly to AdaptiveEngine.
        """
        # Always compute deterministic baseline first
        current_comp = interview.questions[-1].skill if interview.questions else (
            interview.target_competencies[0] if interview.target_competencies else "General"
        )
        deterministic_decision = self.adaptive_engine.decide_next_step(
            current_question_number=interview.current_question_number,
            question_limit=interview.question_limit,
            current_difficulty=interview.current_difficulty,
            current_competency=current_comp,
            latest_evaluation=latest_evaluation,
            skill_profile=interview.skill_profile,
            questions_history=interview.questions,
            target_competencies=interview.target_competencies,
        )

        if not self.agentic_mode:
            logger.info("AGENTIC_MODE is false; executing deterministic adaptive engine")
            return deterministic_decision

        logger.info("Executing AgentCore orchestration with Bedrock tools")
        try:
            tool_executor = AgentToolExecutor(interview, user_sub)
            state_summary = {
                "interview_id": interview.interview_id,
                "role": interview.role,
                "current_question": interview.current_question_number,
                "question_limit": interview.question_limit,
                "current_difficulty": interview.current_difficulty,
                "target_competencies": interview.target_competencies,
                "latest_evaluation": {
                    "overall_score": latest_evaluation.overall_score,
                    "follow_up_warranted": latest_evaluation.follow_up_warranted,
                    "follow_up_reason": latest_evaluation.follow_up_reason,
                    "missing_concepts": latest_evaluation.missing_concepts,
                    "recommended_focus_skill": latest_evaluation.recommended_focus_skill,
                },
                "skill_profile": {k: v.current_score for k, v in interview.skill_profile.items()},
            }

            user_message = (
                f"Review candidate performance and propose next action:\n{json.dumps(state_summary, indent=2)}"
            )

            response = self.bedrock_client.converse(
                modelId=self.model_id,
                system=[{"text": AGENT_SYSTEM_PROMPT}],
                messages=[{"role": "user", "content": [{"text": user_message}]}],
                toolConfig={"tools": AGENT_TOOL_DEFINITIONS},
                inferenceConfig={"temperature": 0.2, "maxTokens": 1024},
            )

            # Check if agent invoked propose_next_action
            output_msg = response.get("output", {}).get("message", {})
            content_blocks = output_msg.get("content", [])
            
            proposed_action = None
            for block in content_blocks:
                tool_use = block.get("toolUse")
                if tool_use and tool_use.get("name") == "propose_next_action":
                    proposed_action = tool_use.get("input", {})
                    break

            if not proposed_action:
                logger.warning("Agent did not return a valid propose_next_action call. Using deterministic fallback.")
                return deterministic_decision

            # Pass through Safety Boundary
            safe_decision = AgentSafetyBoundary.validate_action(
                proposed_action=proposed_action,
                interview=interview,
                user_sub=user_sub,
                deterministic_fallback=deterministic_decision,
            )
            return safe_decision

        except Exception as e:
            logger.error(
                f"AgentCore orchestration error: {str(e)}. Falling back to deterministic engine.",
                extra={"error": str(e)}
            )
            return deterministic_decision
