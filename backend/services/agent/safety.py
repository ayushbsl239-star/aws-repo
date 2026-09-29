"""
Safety Boundary Layer for Agentic AI actions.
Validates all LLM-proposed actions against hard business invariants.
Rejects unauthorized transitions and falls back to deterministic engine.
"""
from typing import Dict, Any, Optional
from backend.models.interview import InterviewModel, InterviewStatus
from backend.services.adaptive.engine import AdaptiveDecision
from backend.utils.logger import logger


class AgentSafetyBoundary:
    @staticmethod
    def validate_action(
        proposed_action: Dict[str, Any],
        interview: InterviewModel,
        user_sub: str,
        deterministic_fallback: AdaptiveDecision,
    ) -> AdaptiveDecision:
        """
        Validates proposed agent action against safety constraints:
        1. User ownership
        2. Active interview status
        3. Question budget constraints
        4. Difficulty boundaries [1, 5]
        5. Valid competency names
        """
        # Invariant 1: Ownership
        if interview.owner_sub != user_sub:
            logger.error("Safety violation: User does not own interview")
            return deterministic_fallback

        # Invariant 2: Active status
        if interview.status != InterviewStatus.ACTIVE:
            logger.warning("Safety violation: Interview is not in ACTIVE state")
            return deterministic_fallback

        action_name = proposed_action.get("action")
        proposed_difficulty = proposed_action.get("next_difficulty")
        proposed_competency = proposed_action.get("next_competency")
        reason = proposed_action.get("reason", "Agent proposed action")

        # Invariant 3: Question budget
        questions_remaining = interview.question_limit - interview.current_question_number
        if questions_remaining <= 0 and action_name != "END_INTERVIEW":
            logger.warning(
                "Safety correction: Budget exhausted, forcing END_INTERVIEW despite agent proposal",
                extra={"agent_action": action_name}
            )
            return AdaptiveDecision(
                action="END_INTERVIEW",
                next_difficulty=interview.current_difficulty,
                next_competency=interview.questions[-1].skill if interview.questions else "General",
                reason="Question budget reached. Finalizing interview safely.",
            )

        # Invariant 4: Difficulty bounds
        if not isinstance(proposed_difficulty, int) or proposed_difficulty < 1 or proposed_difficulty > 5:
            logger.warning(
                f"Safety violation: Proposed difficulty {proposed_difficulty} out of bounds [1,5]. Falling back to deterministic.",
            )
            return deterministic_fallback

        # Invariant 5: Max difficulty jump limit (cannot jump > 1 step at once)
        if abs(proposed_difficulty - interview.current_difficulty) > 1:
            logger.warning(
                f"Safety violation: Excessive difficulty jump from {interview.current_difficulty} to {proposed_difficulty}. Clamping.",
            )
            clamped = interview.current_difficulty + (1 if proposed_difficulty > interview.current_difficulty else -1)
            proposed_difficulty = max(1, min(5, clamped))

        # Invariant 6: Follow-up constraints
        is_follow_up = False
        follow_up_reason = None
        if action_name == "ASK_FOLLOWUP":
            if questions_remaining < 2:
                logger.info("Safety check: Cannot ask follow-up on penultimate or final question. Using fallback.")
                return deterministic_fallback
            is_follow_up = True
            follow_up_reason = reason

        logger.info(
            f"Agent action '{action_name}' passed safety validation",
            extra={"action": action_name, "competency": proposed_competency, "difficulty": proposed_difficulty}
        )
        return AdaptiveDecision(
            action=action_name,
            next_difficulty=proposed_difficulty,
            next_competency=proposed_competency or "General",
            reason=f"[AgentCore] {reason}",
            is_follow_up=is_follow_up,
            follow_up_reason=follow_up_reason,
        )
