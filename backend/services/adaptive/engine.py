"""
Deterministic Adaptive Engine for interview progression.
Controls question difficulty (1-5), competency switching, follow-up decisions, and completion.
"""
from dataclasses import dataclass
from typing import Dict, List, Optional
from backend.models.evaluation import EvaluationOutput
from backend.models.interview import QuestionModel, SkillScore
from backend.utils.logger import logger


@dataclass
class AdaptiveDecision:
    action: str
    next_difficulty: int
    next_competency: str
    reason: str
    is_follow_up: bool = False
    follow_up_reason: Optional[str] = None


class AdaptiveEngine:
    def __init__(self):
        pass

    def decide_next_step(
        self,
        current_question_number: int,
        question_limit: int,
        current_difficulty: int,
        current_competency: str,
        latest_evaluation: EvaluationOutput,
        skill_profile: Dict[str, SkillScore],
        questions_history: List[QuestionModel],
        target_competencies: List[str],
    ) -> AdaptiveDecision:
        """
        Determines next interview action deterministically based on candidate performance.
        Never allows LLM unconstrained control over difficulty bounds or completion.
        """
        # 1. Budget boundary check
        if current_question_number >= question_limit:
            return AdaptiveDecision(
                action="END_INTERVIEW",
                next_difficulty=current_difficulty,
                next_competency=current_competency,
                reason=f"Reached configured question limit ({question_limit}). Finalizing interview.",
            )

        score = latest_evaluation.overall_score if latest_evaluation.overall_score is not None else 5.0
        questions_remaining = question_limit - current_question_number

        # 2. Check for targeted follow-up
        was_previous_followup = (
            len(questions_history) > 0 and questions_history[-1].question_type.value == "follow_up"
        )
        if (
            latest_evaluation.follow_up_warranted
            and questions_remaining >= 2
            and not was_previous_followup
        ):
            reason_text = latest_evaluation.follow_up_reason or "Probing deeper into candidate's claim/trade-off."
            logger.info(
                f"Adaptive decision: ASK_FOLLOWUP on '{current_competency}' at difficulty {current_difficulty}",
                extra={"reason": reason_text}
            )
            return AdaptiveDecision(
                action="ASK_FOLLOWUP",
                next_difficulty=current_difficulty,
                next_competency=current_competency,
                reason=f"Candidate answer warrants clarification: {reason_text}",
                is_follow_up=True,
                follow_up_reason=reason_text,
            )

        # 3. Calculate competency question coverage
        competency_counts: Dict[str, int] = {}
        for q in questions_history:
            competency_counts[q.skill] = competency_counts.get(q.skill, 0) + 1
        current_comp_count = competency_counts.get(current_competency, 0)

        # Untested competencies in the target pool
        untested = [c for c in target_competencies if competency_counts.get(c, 0) == 0]

        # 4. High Performance (Score >= 8.0)
        if score >= 8.0:
            new_difficulty = min(5, current_difficulty + 1)
            # If current competency has been adequately covered and others are untested, switch
            if current_comp_count >= 2 and untested:
                next_comp = untested[0]
                return AdaptiveDecision(
                    action="SWITCH_COMPETENCY",
                    next_difficulty=new_difficulty,
                    next_competency=next_comp,
                    reason=f"Strong answer ({score}/10). Skill verified; switching to evaluate {next_comp} at difficulty {new_difficulty}.",
                )
            else:
                return AdaptiveDecision(
                    action="INCREASE_DIFFICULTY",
                    next_difficulty=new_difficulty,
                    next_competency=current_competency,
                    reason=f"Strong answer ({score}/10). Escalating challenge from {current_difficulty} to {new_difficulty} on {current_competency}.",
                )

        # 5. Satisfactory Performance (5.0 <= Score < 8.0)
        elif score >= 5.0:
            new_difficulty = current_difficulty
            if current_comp_count >= 2 and untested:
                next_comp = untested[0]
                return AdaptiveDecision(
                    action="SWITCH_COMPETENCY",
                    next_difficulty=new_difficulty,
                    next_competency=next_comp,
                    reason=f"Solid response ({score}/10). Moving to untested competency {next_comp} at difficulty {new_difficulty}.",
                )
            else:
                return AdaptiveDecision(
                    action="MAINTAIN_DIFFICULTY",
                    next_difficulty=new_difficulty,
                    next_competency=current_competency,
                    reason=f"Moderate response ({score}/10). Maintaining difficulty {current_difficulty} to gather further evidence.",
                )

        # 6. Weak Performance (Score < 5.0)
        else:
            new_difficulty = max(1, current_difficulty - 1)
            # Find candidate's weakest observed skill or continue diagnosing this one
            return AdaptiveDecision(
                action="DECREASE_DIFFICULTY",
                next_difficulty=new_difficulty,
                next_competency=current_competency,
                reason=f"Gaps identified ({score}/10). Lowering difficulty to {new_difficulty} to test foundational principles.",
            )
