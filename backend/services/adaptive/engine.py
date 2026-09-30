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
    level: str = "MEDIUM"
    is_follow_up: bool = False
    follow_up_reason: Optional[str] = None


class AdaptiveEngine:
    def __init__(self):
        pass

    def classify_performance(self, score_100: float) -> str:
        """Classify candidate answer score (0-100 scale)."""
        if score_100 >= 75:
            return "STRONG"
        elif score_100 >= 45:
            return "MEDIUM"
        else:
            return "WEAK"

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
                level="COMPLETED",
            )

        raw_score = latest_evaluation.overall_score if latest_evaluation.overall_score is not None else 5.0
        score_100 = int(round(raw_score * 10)) if raw_score <= 10.0 else int(round(raw_score))
        level = self.classify_performance(score_100)
        questions_remaining = question_limit - current_question_number

        # 2. Check for targeted follow-up
        was_previous_followup = (
            len(questions_history) > 0 and getattr(questions_history[-1], 'question_type', None) and getattr(questions_history[-1].question_type, 'value', '') == "follow_up"
        )
        if (
            getattr(latest_evaluation, 'follow_up_warranted', False)
            and questions_remaining >= 2
            and not was_previous_followup
        ):
            reason_text = getattr(latest_evaluation, 'follow_up_reason', None) or "Probing deeper into candidate's claim/trade-off."
            logger.info(
                f"Adaptive decision: ASK_FOLLOWUP on '{current_competency}' at difficulty {current_difficulty}",
                extra={"reason": reason_text}
            )
            return AdaptiveDecision(
                action="ASK_FOLLOWUP",
                next_difficulty=current_difficulty,
                next_competency=current_competency,
                reason=f"Candidate answer warrants clarification: {reason_text}",
                level=level,
                is_follow_up=True,
                follow_up_reason=reason_text,
            )

        # 3. Calculate competency question coverage
        competency_counts: Dict[str, int] = {}
        for q in questions_history:
            competency_counts[q.skill] = competency_counts.get(q.skill, 0) + 1
        current_comp_count = competency_counts.get(current_competency, 0)
        untested = [c for c in target_competencies if competency_counts.get(c, 0) == 0]

        # 4. STRONG Performance (score >= 75) -> Increase difficulty
        if level == "STRONG":
            new_difficulty = min(5, current_difficulty + 1)
            if current_comp_count >= 2 and untested:
                next_comp = untested[0]
                return AdaptiveDecision(
                    action="SWITCH_COMPETENCY",
                    next_difficulty=new_difficulty,
                    next_competency=next_comp,
                    reason=f"Strong answer ({score_100}/100); skill verified; switching to evaluate {next_comp} at difficulty {new_difficulty}.",
                    level="STRONG",
                )
            else:
                return AdaptiveDecision(
                    action="INCREASE_DIFFICULTY",
                    next_difficulty=new_difficulty,
                    next_competency=current_competency,
                    reason=f"Strong answer ({score_100}/100); increasing complexity from {current_difficulty} to {new_difficulty} on {current_competency}.",
                    level="STRONG",
                )

        # 5. MEDIUM Performance (45 <= score < 75) -> Maintain difficulty
        elif level == "MEDIUM":
            new_difficulty = current_difficulty
            if current_comp_count >= 2 and untested:
                next_comp = untested[0]
                return AdaptiveDecision(
                    action="SWITCH_COMPETENCY",
                    next_difficulty=new_difficulty,
                    next_competency=next_comp,
                    reason=f"Medium answer ({score_100}/100); moving to untested competency {next_comp} at difficulty {new_difficulty}.",
                    level="MEDIUM",
                )
            else:
                return AdaptiveDecision(
                    action="MAINTAIN_DIFFICULTY",
                    next_difficulty=new_difficulty,
                    next_competency=current_competency,
                    reason=f"Medium answer ({score_100}/100); maintaining difficulty level {current_difficulty} for related concepts.",
                    level="MEDIUM",
                )

        # 6. WEAK Performance (score < 45) -> Reduce difficulty
        else:
            new_difficulty = max(1, current_difficulty - 1)
            return AdaptiveDecision(
                action="DECREASE_DIFFICULTY",
                next_difficulty=new_difficulty,
                next_competency=current_competency,
                reason=f"Weak answer ({score_100}/100); reducing difficulty to {new_difficulty} to test core foundational concepts.",
                level="WEAK",
            )
