"""
Candidate skill profile updater with confidence-weighted exponential moving average.
Ensures single anomalous or low-confidence evaluations do not prematurely distort scores.
"""
from typing import Dict, Optional
from backend.models.interview import SkillScore
from backend.utils.logger import logger


def update_skill_score(
    skill_name: str,
    new_raw_score: float,
    confidence: float,
    current_profile: Dict[str, SkillScore],
) -> SkillScore:
    """
    Updates or initializes a competency score in the candidate profile.

    Formula:
    For observation 1:
        S_1 = new_raw_score
    For observation n (n > 1):
        effective_weight w = base_alpha * confidence
        where base_alpha = max(0.25, 1.0 / (n ** 0.5))
        S_n = (1 - w) * S_{n-1} + (w * new_raw_score)

    If evaluator confidence is low (e.g. < 0.6), the weight is scaled down,
    preventing noisy AI judgements from swinging the candidate's profile.
    """
    clamped_score = max(0.0, min(10.0, round(new_raw_score, 2)))
    clamped_confidence = max(0.1, min(1.0, float(confidence)))

    if skill_name not in current_profile:
        # First observation for this skill
        entry = SkillScore(
            skill_name=skill_name,
            current_score=clamped_score,
            previous_score=None,
            observation_count=1,
            confidence=clamped_confidence,
        )
        current_profile[skill_name] = entry
        logger.info(
            f"Initialized skill '{skill_name}' score at {clamped_score}",
            extra={"skill": skill_name, "score": clamped_score}
        )
        return entry

    existing = current_profile[skill_name]
    prev = existing.current_score
    n = existing.observation_count + 1

    # Adaptive smoothing factor
    base_alpha = max(0.25, 1.0 / (n**0.5))
    weight = base_alpha * clamped_confidence
    
    updated_val = ((1.0 - weight) * prev) + (weight * clamped_score)
    updated_val = round(updated_val, 2)

    existing.previous_score = prev
    existing.current_score = updated_val
    existing.observation_count = n
    existing.confidence = round((existing.confidence * 0.7) + (clamped_confidence * 0.3), 2)
    
    logger.info(
        f"Updated skill '{skill_name}': {prev} -> {updated_val} (obs={n}, weight={round(weight, 3)})",
        extra={
            "skill": skill_name,
            "previous": prev,
            "current": updated_val,
            "raw": clamped_score,
            "weight": round(weight, 3)
        }
    )
    return existing
