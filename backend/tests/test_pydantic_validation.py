"""
Pydantic validation and rubric weighted score computation tests.
"""
from backend.models.evaluation import EvaluationOutput, QuestionGenerationOutput
from backend.services.bedrock.validator import extract_json_from_text, validate_and_parse_llm_response


def test_extract_json_from_markdown_codeblock():
    markdown = """Here is the evaluation:
```json
{
  "technical_accuracy": 8.5,
  "relevance": 9.0,
  "completeness": 8.0,
  "communication": 7.5,
  "problem_solving": 8.0,
  "strengths": ["Clear explanation of window functions"],
  "weaknesses": ["Did not mention frame specification"],
  "missing_concepts": ["ROWS BETWEEN"],
  "skills_demonstrated": ["SQL"],
  "recommended_focus_skill": "Advanced SQL",
  "follow_up_warranted": false,
  "confidence": 0.95
}
```
Hope this helps!"""
    data = extract_json_from_text(markdown)
    assert data is not None
    assert data["technical_accuracy"] == 8.5
    assert data["strengths"] == ["Clear explanation of window functions"]


def test_technical_rubric_server_side_calculation():
    """
    Rubric:
    tech_accuracy (30%), relevance (20%), completeness (20%), comms (15%), problem_solving (15%)
    Expected = 0.30(10) + 0.20(10) + 0.20(5) + 0.15(8) + 0.15(6)
             = 3.0 + 2.0 + 1.0 + 1.2 + 0.9 = 8.1
    """
    ev = EvaluationOutput(
        technical_accuracy=10.0,
        relevance=10.0,
        completeness=5.0,
        communication=8.0,
        problem_solving=6.0,
    )
    score = ev.calculate_weighted_overall_score(interview_type="technical")
    assert score == 8.1
    assert ev.overall_score == 8.1


def test_behavioral_rubric_server_side_calculation():
    """
    STAR Rubric:
    relevance (25%), problem_solving (30%), completeness (25%), comms (20%)
    Expected = 0.25(8) + 0.30(9) + 0.25(8) + 0.20(10)
             = 2.0 + 2.7 + 2.0 + 2.0 = 8.7
    """
    ev = EvaluationOutput(
        technical_accuracy=0.0,
        relevance=8.0,
        completeness=8.0,
        communication=10.0,
        problem_solving=9.0,
    )
    score = ev.calculate_weighted_overall_score(interview_type="behavioral")
    assert score == 8.7
