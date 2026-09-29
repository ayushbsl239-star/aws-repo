"""
Data models for Interview, Question, Answer, and Candidate Skill State.
"""
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import time


class InterviewType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    MIXED = "mixed"
    JOB_SPECIFIC = "job_specific"


class ExperienceLevel(str, Enum):
    FRESHER = "fresher"
    JUNIOR = "0-2 years"
    MID = "2-5 years"
    SENIOR = "5-10 years"
    EXPERT = "10+ years"


class InputMode(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    TEXT_VOICE = "text_voice"


class InterviewStatus(str, Enum):
    CONFIGURED = "CONFIGURED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class QuestionType(str, Enum):
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    SCENARIO = "scenario"
    FOLLOW_UP = "follow_up"


class SkillScore(BaseModel):
    skill_name: str
    current_score: float = Field(..., ge=0.0, le=10.0)
    previous_score: Optional[float] = None
    observation_count: int = 1
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    last_updated: float = Field(default_factory=time.time)


class QuestionModel(BaseModel):
    question_id: str
    question_number: int
    question_text: str
    skill: str
    difficulty: int = Field(..., ge=1, le=5)
    question_type: QuestionType = QuestionType.TECHNICAL
    expected_concepts: List[str] = Field(default_factory=list)
    reason_for_selection: Optional[str] = None
    created_at: float = Field(default_factory=time.time)
    answer_text: Optional[str] = None
    answered_at: Optional[float] = None
    evaluation: Optional[Dict[str, Any]] = None
    agent_decision: Optional[str] = None

    def to_client_dict(self) -> Dict[str, Any]:
        """Sanitize fields returned to candidate during active interview."""
        return {
            "id": self.question_id,
            "number": self.question_number,
            "question": self.question_text,
            "skill": self.skill,
            "difficulty": self.difficulty,
            "type": self.question_type.value,
        }


class InterviewModel(BaseModel):
    interview_id: str
    owner_sub: str
    role: str
    experience: str
    interview_type: InterviewType = InterviewType.MIXED
    question_limit: int = Field(default=8, ge=3, le=20)
    input_mode: InputMode = InputMode.TEXT
    status: InterviewStatus = InterviewStatus.CONFIGURED
    current_question_number: int = 0
    current_difficulty: int = Field(default=2, ge=1, le=5)
    
    # Context references
    job_description_text: Optional[str] = None
    job_description_s3_key: Optional[str] = None
    jd_analysis: Optional[Dict[str, Any]] = None
    
    resume_text: Optional[str] = None
    resume_s3_key: Optional[str] = None
    resume_analysis: Optional[Dict[str, Any]] = None

    # Competency pool
    target_competencies: List[str] = Field(default_factory=list)
    skill_profile: Dict[str, SkillScore] = Field(default_factory=dict)
    
    # History
    questions: List[QuestionModel] = Field(default_factory=list)
    
    # Completion & Scoring
    readiness_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    final_report_s3_key: Optional[str] = None
    final_report: Optional[Dict[str, Any]] = None

    created_at: float = Field(default_factory=time.time)
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
