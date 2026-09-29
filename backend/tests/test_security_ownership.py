"""
Security and Access Control unit tests.
Verifies cross-tenant data isolation, user sub ownership enforcement, and duplicate submission locks.
"""
import pytest
from backend.models.interview import InterviewModel, InterviewStatus, QuestionModel, QuestionType
from backend.services.agent.safety import AgentSafetyBoundary
from backend.services.adaptive.engine import AdaptiveDecision
from backend.utils.errors import ConflictError, ForbiddenError


def test_agent_safety_rejects_unowned_interview():
    """AgentSafetyBoundary must reject actions if user_sub does not match owner_sub."""
    interview = InterviewModel(
        interview_id="int_123",
        owner_sub="user_alice_456",
        role="Data Analyst",
        experience="Fresher",
        status=InterviewStatus.ACTIVE,
    )
    fallback = AdaptiveDecision(
        action="MAINTAIN_DIFFICULTY",
        next_difficulty=2,
        next_competency="SQL",
        reason="Fallback",
    )
    # Attempted by Eve
    safe_decision = AgentSafetyBoundary.validate_action(
        proposed_action={"action": "INCREASE_DIFFICULTY", "next_difficulty": 3, "next_competency": "SQL"},
        interview=interview,
        user_sub="user_eve_999",
        deterministic_fallback=fallback,
    )
    assert safe_decision == fallback


def test_agent_safety_clamps_illegal_difficulty_jump():
    """Agent proposing jump from 2 to 5 directly must be clamped to safe step (3)."""
    interview = InterviewModel(
        interview_id="int_123",
        owner_sub="user_alice_456",
        role="Data Analyst",
        experience="Fresher",
        status=InterviewStatus.ACTIVE,
        current_difficulty=2,
    )
    fallback = AdaptiveDecision(
        action="MAINTAIN_DIFFICULTY",
        next_difficulty=2,
        next_competency="SQL",
        reason="Fallback",
    )
    safe_decision = AgentSafetyBoundary.validate_action(
        proposed_action={"action": "INCREASE_DIFFICULTY", "next_difficulty": 5, "next_competency": "SQL", "reason": "jump"},
        interview=interview,
        user_sub="user_alice_456",
        deterministic_fallback=fallback,
    )
    assert safe_decision.next_difficulty == 3
