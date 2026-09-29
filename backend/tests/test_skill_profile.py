"""
Unit tests for Candidate Skill Profile updater.
Verifies confidence weighting, rolling moving average, and outlier protection.
"""
from backend.services.adaptive.skill_profile import update_skill_score


def test_first_observation_initializes_score():
    profile = {}
    res = update_skill_score("SQL", 8.4, 0.9, profile)
    assert res.skill_name == "SQL"
    assert res.current_score == 8.4
    assert res.previous_score is None
    assert res.observation_count == 1
    assert "SQL" in profile


def test_second_observation_updates_with_exponential_weight():
    profile = {}
    update_skill_score("SQL", 8.0, 0.9, profile)
    # Second answer is lower (e.g. 5.0)
    updated = update_skill_score("SQL", 5.0, 0.9, profile)
    assert updated.observation_count == 2
    assert updated.previous_score == 8.0
    # Score should be smoothly intermediate, not dropping directly to 5.0
    assert 5.0 < updated.current_score < 8.0


def test_low_confidence_reduces_update_weight():
    """A low-confidence score should move the profile much less than high-confidence."""
    profile_high = {}
    update_skill_score("Python", 8.0, 1.0, profile_high)
    update_skill_score("Python", 2.0, 0.9, profile_high)

    profile_low = {}
    update_skill_score("Python", 8.0, 1.0, profile_low)
    update_skill_score("Python", 2.0, 0.2, profile_low)

    # Low-confidence update should preserve more of the prior score (closer to 8.0)
    assert profile_low["Python"].current_score > profile_high["Python"].current_score


def test_score_clamping():
    profile = {}
    res = update_skill_score("Statistics", 14.5, 1.0, profile)
    assert res.current_score == 10.0

    res_neg = update_skill_score("Communication", -3.2, 1.0, profile)
    assert res_neg.current_score == 0.0
