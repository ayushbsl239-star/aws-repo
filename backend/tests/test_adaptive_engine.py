"""
Unit tests for deterministic AdaptiveEngine.
Verifies difficulty clamping [1, 5], progression rules, follow-ups, and budget constraints.
"""
import pytest
from backend.models.evaluation import EvaluationOutput
from backend.models.interview import QuestionModel, QuestionType
from backend.services.adaptive.engine import AdaptiveEngine


@pytest.fixture
def engine():
    return AdaptiveEngine()


def make_eval(overall_score: float, follow_up: bool = False, reason: str = "", confidence: float = 0.9):
    ev = EvaluationOutput(
        technical_accuracy=overall_score,
        relevance=overall_score,
        completeness=overall_score,
        communication=overall_score,
        problem_solving=overall_score,
        follow_up_warranted=follow_up,
        follow_up_reason=reason,
        confidence=confidence,
    )
    ev.overall_score = overall_score
    return ev


def test_question_budget_completion(engine):
    """When current_question reaches limit, must return END_INTERVIEW."""
    decision = engine.decide_next_step(
        current_question_number=5,
        question_limit=5,
        current_difficulty=3,
        current_competency="SQL",
        latest_evaluation=make_eval(9.0),
        skill_profile={},
        questions_history=[],
        target_competencies=["SQL", "Python"],
    )
    assert decision.action == "END_INTERVIEW"


def test_high_score_escalates_difficulty(engine):
    """Score >= 8.0 should increase difficulty by 1 up to maximum 5."""
    decision = engine.decide_next_step(
        current_question_number=2,
        question_limit=5,
        current_difficulty=2,
        current_competency="SQL",
        latest_evaluation=make_eval(8.5),
        skill_profile={},
        questions_history=[],
        target_competencies=["SQL", "Python"],
    )
    assert decision.action == "INCREASE_DIFFICULTY"
    assert decision.next_difficulty == 3


def test_difficulty_cannot_exceed_max_five(engine):
    """Difficulty must never exceed 5."""
    decision = engine.decide_next_step(
        current_question_number=2,
        question_limit=5,
        current_difficulty=5,
        current_competency="SQL",
        latest_evaluation=make_eval(9.5),
        skill_profile={},
        questions_history=[],
        target_competencies=["SQL", "Python"],
    )
    assert decision.next_difficulty == 5


def test_low_score_reduces_difficulty(engine):
    """Score < 5.0 reduces difficulty by 1 down to minimum 1."""
    decision = engine.decide_next_step(
        current_question_number=2,
        question_limit=5,
        current_difficulty=3,
        current_competency="Statistics",
        latest_evaluation=make_eval(3.8),
        skill_profile={},
        questions_history=[],
        target_competencies=["Statistics", "Python"],
    )
    assert decision.action == "DECREASE_DIFFICULTY"
    assert decision.next_difficulty == 2


def test_difficulty_cannot_drop_below_one(engine):
    """Difficulty must never drop below 1."""
    decision = engine.decide_next_step(
        current_question_number=2,
        question_limit=5,
        current_difficulty=1,
        current_competency="Statistics",
        latest_evaluation=make_eval(2.0),
        skill_profile={},
        questions_history=[],
        target_competencies=["Statistics", "Python"],
    )
    assert decision.next_difficulty == 1


def test_moderate_score_maintains_difficulty(engine):
    """5.0 <= Score < 8.0 maintains difficulty."""
    decision = engine.decide_next_step(
        current_question_number=1,
        question_limit=5,
        current_difficulty=3,
        current_competency="Python",
        latest_evaluation=make_eval(6.5),
        skill_profile={},
        questions_history=[],
        target_competencies=["Python", "SQL"],
    )
    assert decision.action == "MAINTAIN_DIFFICULTY"
    assert decision.next_difficulty == 3


def test_follow_up_warranted_triggers_follow_up(engine):
    """When follow_up_warranted is True and budget allows, triggers ASK_FOLLOWUP."""
    eval_with_gap = make_eval(6.2, follow_up=True, reason="Candidate mentioned Redis caching without explaining invalidation strategy.")
    decision = engine.decide_next_step(
        current_question_number=2,
        question_limit=6,
        current_difficulty=3,
        current_competency="System Design",
        latest_evaluation=eval_with_gap,
        skill_profile={},
        questions_history=[],
        target_competencies=["System Design", "Algorithms"],
    )
    assert decision.action == "ASK_FOLLOWUP"
    assert decision.is_follow_up is True
    assert "Redis" in decision.follow_up_reason
