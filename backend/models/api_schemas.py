"""
API Request and Response Data Transfer Objects (DTOs).
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class CreateInterviewRequest(BaseModel):
    role: str = Field(..., min_length=2)
    experience: str = Field(..., min_length=1)
    interview_type: str = Field(default="mixed")
    question_limit: int = Field(default=8, ge=3, le=20)
    input_mode: str = Field(default="text")
    job_description_text: Optional[str] = None
    job_description_s3_key: Optional[str] = None
    resume_text: Optional[str] = None
    resume_s3_key: Optional[str] = None


class StartInterviewResponse(BaseModel):
    interview_id: str
    status: str
    current_difficulty: int
    first_question: Dict[str, Any]


class SubmitAnswerRequest(BaseModel):
    question_id: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=2)


class SubmitAnswerResponse(BaseModel):
    accepted: bool = True
    interview_status: str
    completed: bool = False
    next_question: Optional[Dict[str, Any]] = None
    
    # Debug/Demo data (populated only when VITE_DEMO_DEBUG=true or explicitly requested)
    debug_info: Optional[Dict[str, Any]] = None


class PresignRequest(BaseModel):
    file_name: str
    file_type: str
    category: str = "document"  # "document", "resume", "voice"


class PresignResponse(BaseModel):
    upload_url: str
    s3_key: str
    fields: Dict[str, Any] = Field(default_factory=dict)


class ProcessDocumentRequest(BaseModel):
    s3_key: str
    category: str  # "job_description" or "resume"
    raw_text: Optional[str] = None


class PracticeWeaknessesRequest(BaseModel):
    previous_interview_id: str
    question_limit: int = 5


class DashboardSummaryResponse(BaseModel):
    total_interviews_completed: int
    average_readiness_score: float
    strongest_skill: Optional[str] = None
    primary_improvement_area: Optional[str] = None
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)
    progress_trend: List[Dict[str, Any]] = Field(default_factory=list)
    recent_interviews: List[Dict[str, Any]] = Field(default_factory=list)
