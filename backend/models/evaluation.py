"""
Evaluation response models and server-side scoring rubrics.
"""
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class EvaluationOutput(BaseModel):
    technical_accuracy: float = Field(..., ge=0.0, le=10.0)
    relevance: float = Field(..., ge=0.0, le=10.0)
    completeness: float = Field(..., ge=0.0, le=10.0)
    communication: float = Field(..., ge=0.0, le=10.0)
    problem_solving: float = Field(..., ge=0.0, le=10.0)
    
    # Qualitative insights
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missing_concepts: List[str] = Field(default_factory=list)
    skills_demonstrated: List[str] = Field(default_factory=list)
    recommended_focus_skill: str = Field(default="")
    
    # Follow-up determination
    follow_up_warranted: bool = Field(default=False)
    follow_up_reason: Optional[str] = Field(default="")
    
    # Evaluator confidence in its assessment (NOT candidate performance)
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
    
    # Server-calculated weighted score
    overall_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)

    @field_validator("technical_accuracy", "relevance", "completeness", "communication", "problem_solving")
    @classmethod
    def clamp_scores(cls, v: float) -> float:
        return max(0.0, min(10.0, round(float(v), 2)))

    def calculate_weighted_overall_score(self, interview_type: str = "technical") -> float:
        """
        Computes deterministic, server-side weighted score.
        Never blindly trusts an LLM-supplied overall score.
        """
        if interview_type == "behavioral":
            # STAR-adjusted weighting
            # Relevance (Context/Task) 25%, Problem-solving (Action/Reasoning) 30%, 
            # Completeness (Result/Reflection) 25%, Communication 20%
            weighted = (
                0.25 * self.relevance +
                0.30 * self.problem_solving +
                0.25 * self.completeness +
                0.20 * self.communication
            )
        else:
            # Technical rubric:
            # Technical accuracy 30%, Relevance 20%, Completeness 20%, Communication 15%, Problem-solving 15%
            weighted = (
                0.30 * self.technical_accuracy +
                0.20 * self.relevance +
                0.20 * self.completeness +
                0.15 * self.communication +
                0.15 * self.problem_solving
            )
        self.overall_score = round(weighted, 2)
        return self.overall_score


class QuestionGenerationOutput(BaseModel):
    question: str = Field(..., min_length=10)
    skill: str = Field(..., min_length=2)
    difficulty: int = Field(..., ge=1, le=5)
    question_type: str = Field(default="technical")
    expected_concepts: List[str] = Field(default_factory=list)
    reason_for_selection: str = Field(default="")


class JobDescriptionAnalysis(BaseModel):
    job_title: str = ""
    seniority: str = ""
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    technical_competencies: List[str] = Field(default_factory=list)
    behavioral_competencies: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    domain_knowledge: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class ResumeAnalysis(BaseModel):
    declared_skills: List[str] = Field(default_factory=list)
    technologies: List[str] = Field(default_factory=list)
    projects: List[dict] = Field(default_factory=list)
    experience_highlights: List[str] = Field(default_factory=list)
    education: Optional[str] = None
    notable_achievements: List[str] = Field(default_factory=list)
