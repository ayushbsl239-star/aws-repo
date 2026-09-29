import time
from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey
from backend.data.db import Base

class UserORM(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(Float, default=time.time)

class InterviewORM(Base):
    __tablename__ = "interviews"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    role = Column(String, nullable=False)
    experience = Column(String, nullable=False)
    interview_type = Column(String, default="mixed")
    question_limit = Column(Integer, default=8)
    input_mode = Column(String, default="text")
    status = Column(String, default="CONFIGURED")
    current_question_number = Column(Integer, default=0)
    current_difficulty = Column(Integer, default=2)
    
    job_description_text = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=True)
    
    target_competencies = Column(Text, nullable=True)  # JSON string list
    skill_profile_json = Column(Text, nullable=True)   # JSON string dict
    
    readiness_score = Column(Float, nullable=True)
    final_report_json = Column(Text, nullable=True)    # JSON string dict
    
    created_at = Column(Float, default=time.time)
    started_at = Column(Float, nullable=True)
    completed_at = Column(Float, nullable=True)

class QuestionORM(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, index=True)
    interview_id = Column(String, ForeignKey("interviews.id"), index=True, nullable=False)
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    skill = Column(String, nullable=False)
    difficulty = Column(Integer, default=2)
    question_type = Column(String, default="technical")
    expected_concepts_json = Column(Text, nullable=True)
    reason_for_selection = Column(Text, nullable=True)
    answer_text = Column(Text, nullable=True)
    answered_at = Column(Float, nullable=True)
    evaluation_json = Column(Text, nullable=True)
    agent_decision = Column(String, nullable=True)
    created_at = Column(Float, default=time.time)
