"""
FastAPI Local Backend Application for AI Adaptive Interview Coach.
Zero AWS dependencies. Powered by SQLite, Argon2, PyJWT, Ollama / Local Rule Engine.
"""
import os
import json
import time
import uuid
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, Depends, HTTPException, status, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from backend.data.db import get_db, init_db
from backend.models.orm import UserORM, InterviewORM, QuestionORM
from backend.utils.auth import hash_password, verify_password, create_access_token, decode_access_token
from backend.services.ai_provider import AIProvider
from backend.services.adaptive.engine import AdaptiveEngine, AdaptiveDecision
from backend.services.adaptive.skill_profile import update_skill_score, SkillScore
from backend.services.reports.pdf_export import generate_simple_pdf_bytes
from backend.services.documents.parser import extract_text_from_bytes

# Initialize FastAPI app
app = FastAPI(
    title="AI Adaptive Interview Coach API",
    description="Local-first AI Adaptive Interview Coach backend (FastAPI + SQLite + Argon2 + Ollama/Rule Fallback)",
    version="2.0.0",
)

# CORS Configuration
default_origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
]

frontend_origins = os.getenv("FRONTEND_ORIGINS", "")

origins = default_origins + [
    origin.strip()
    for origin in frontend_origins.split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Singletons
ai_provider = AIProvider()
adaptive_engine = AdaptiveEngine()

# Initialize DB tables on startup
@app.on_event("startup")
def on_startup():
    init_db()

# Local Storage Directory Setup
STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "storage")
os.makedirs(STORAGE_DIR, exist_ok=True)


# -----------------------------------------------------------------------------
# Pydantic Schemas
# -----------------------------------------------------------------------------
class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    sub: str
    email: str
    name: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CreateInterviewRequest(BaseModel):
    role: str
    experience: str
    interview_type: Optional[str] = "mixed"
    question_limit: Optional[int] = 8
    input_mode: Optional[str] = "text"
    job_description_text: Optional[str] = None
    resume_text: Optional[str] = None

class SubmitAnswerRequest(BaseModel):
    questionId: str
    answer: str

class PracticeWeaknessesRequest(BaseModel):
    previous_interview_id: Optional[str] = None
    question_limit: Optional[int] = 5


# -----------------------------------------------------------------------------
# Auth Helper Dependency
# -----------------------------------------------------------------------------
def get_current_user_profile(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> UserResponse:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing."
        )

    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )

    user = db.query(UserORM).filter(UserORM.id == payload["sub"]).first()
    if not user:
        # Fallback to payload metadata if present
        return UserResponse(
            sub=payload["sub"],
            email=payload.get("email", "candidate@local.dev"),
            name=payload.get("name", "Candidate")
        )

    return UserResponse(
        sub=user.id,
        email=user.email,
        name=user.full_name
    )


# -----------------------------------------------------------------------------
# 1. Health Check Endpoint
# -----------------------------------------------------------------------------
@app.get("/health")
def health_check():
    status_info = ai_provider.refresh_status()
    return {
        "status": "ok",
        "mode": "local",
        "database": True,
        "ai_engine": status_info["ai_engine"],
        "ai_connected": status_info["ai_connected"],
        "engine_display": status_info["engine_display"],
        "model_name": status_info["model_name"]
    }


# -----------------------------------------------------------------------------
# 2. Authentication Endpoints
# -----------------------------------------------------------------------------
@app.post("/auth/signup", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(UserORM).filter(UserORM.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(req.password)

    new_user = UserORM(
        id=user_id,
        full_name=req.full_name,
        email=req.email.lower(),
        password_hash=hashed,
        created_at=time.time()
    )
    db.add(new_user)
    db.commit()

    token = create_access_token({"sub": user_id, "email": new_user.email, "name": new_user.full_name})
    user_res = UserResponse(sub=user_id, email=new_user.email, name=new_user.full_name)

    return AuthTokenResponse(access_token=token, user=user_res)


@app.post("/auth/login", response_model=AuthTokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserORM).filter(UserORM.email == req.email.lower()).first()
    if not user or not verify_password(user.password_hash, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token({"sub": user.id, "email": user.email, "name": user.full_name})
    user_res = UserResponse(sub=user.id, email=user.email, name=user.full_name)

    return AuthTokenResponse(access_token=token, user=user_res)


@app.get("/auth/me", response_model=UserResponse)
def get_me(user: UserResponse = Depends(get_current_user_profile)):
    return user


# -----------------------------------------------------------------------------
# 3. Dashboard Data Endpoint
# -----------------------------------------------------------------------------
ROLE_DEFAULT_COMPETENCIES = {
    "software engineer": ["Data Structures & Algorithms", "System Design", "Coding Quality", "Debugging", "Communication"],
    "data analyst": ["SQL", "Python", "Data Visualization", "Statistics", "Business Acumen"],
    "product manager": ["Product Strategy", "User Research", "Prioritization", "Metrics & Analytics"],
    "cloud engineer": ["AWS Architecture", "Infrastructure as Code", "Security & IAM", "Networking"],
    "data scientist": ["Machine Learning", "Model Evaluation", "Feature Engineering", "Python", "Statistics"],
    "devops engineer": ["CI/CD Pipelines", "Docker/Kubernetes", "Monitoring", "Linux", "Terraform"],
}

@app.get("/dashboard")
def get_dashboard(
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interviews = db.query(InterviewORM).filter(InterviewORM.user_id == user.sub).order_by(InterviewORM.created_at.desc()).all()
    completed_interviews = [i for i in interviews if i.status == "COMPLETED"]

    readiness_scores = [i.readiness_score for i in completed_interviews if i.readiness_score is not None]
    avg_score = round(sum(readiness_scores) / len(readiness_scores), 1) if readiness_scores else 78.5

    # Aggregate skill profile matrix across user interviews
    aggregated_skills: Dict[str, List[float]] = {}
    for i in interviews:
        if i.skill_profile_json:
            try:
                prof = json.loads(i.skill_profile_json)
                for s_name, data in prof.items():
                    s_score = data.get("current_score", 7.0) if isinstance(data, dict) else float(data)
                    aggregated_skills.setdefault(s_name, []).append(s_score)
            except Exception:
                pass

    skill_matrix = {}
    if aggregated_skills:
        for s_name, score_list in aggregated_skills.items():
            skill_matrix[s_name] = round(sum(score_list) / len(score_list), 1)
    else:
        skill_matrix = {
            "System Architecture": 8.2,
            "SQL & Database Design": 8.5,
            "Algorithm Optimization": 7.6,
            "Problem Solving": 8.0,
            "Communication": 8.4,
        }

    recent_list = []
    for i in interviews[:5]:
        recent_list.append({
            "interview_id": i.id,
            "role": i.role,
            "experience": i.experience,
            "status": i.status,
            "date": time.strftime("%Y-%m-%d", time.localtime(i.created_at)),
            "readiness_score": i.readiness_score or (82.0 if i.status == "COMPLETED" else None),
            "question_count": i.current_question_number,
        })

    if not recent_list:
        recent_list = [{
            "interview_id": "demo-int-001",
            "role": "Senior Software Engineer",
            "experience": "5-10 years",
            "status": "COMPLETED",
            "date": time.strftime("%Y-%m-%d"),
            "readiness_score": 84.0,
            "question_count": 5,
        }]

    return {
        "user_name": user.name,
        "interviews_completed": len(completed_interviews) or 1,
        "average_readiness_score": avg_score,
        "top_skill": "SQL & Database Design",
        "target_competencies": list(skill_matrix.keys()),
        "skill_matrix": skill_matrix,
        "recent_interviews": recent_list,
    }


# -----------------------------------------------------------------------------
# 4. Interview Operations
# -----------------------------------------------------------------------------
@app.post("/interviews", status_code=status.HTTP_201_CREATED)
def create_interview(
    req: CreateInterviewRequest,
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interview_id = f"int_{uuid.uuid4().hex[:10]}"
    role_key = req.role.lower().strip()
    target_competencies = ROLE_DEFAULT_COMPETENCIES.get(
        role_key, ["Core Technical Principles", "Problem Solving", "System Architecture", "Communication"]
    )

    new_interview = InterviewORM(
        id=interview_id,
        user_id=user.sub,
        role=req.role,
        experience=req.experience,
        interview_type=req.interview_type or "mixed",
        question_limit=req.question_limit or 8,
        input_mode=req.input_mode or "text",
        status="CONFIGURED",
        current_difficulty=2,
        job_description_text=req.job_description_text,
        resume_text=req.resume_text,
        target_competencies=json.dumps(target_competencies),
        skill_profile_json=json.dumps({c: {"current_score": 7.0, "observation_count": 1} for c in target_competencies}),
        created_at=time.time(),
    )
    db.add(new_interview)
    db.commit()

    return {
        "interview_id": interview_id,
        "status": "CONFIGURED",
        "target_competencies": target_competencies,
    }


@app.get("/interviews")
def list_interviews(
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interviews = db.query(InterviewORM).filter(InterviewORM.user_id == user.sub).order_by(InterviewORM.created_at.desc()).all()
    result = []
    for i in interviews:
        result.append({
            "interview_id": i.id,
            "role": i.role,
            "experience": i.experience,
            "status": i.status,
            "created_at": i.created_at,
            "readiness_score": i.readiness_score,
            "questions_count": i.current_question_number,
        })
    return {"interviews": result}


@app.get("/interviews/{interview_id}")
def get_interview_state(
    interview_id: str,
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewORM).filter(InterviewORM.id == interview_id, InterviewORM.user_id == user.sub).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    questions = db.query(QuestionORM).filter(QuestionORM.interview_id == interview_id).order_by(QuestionORM.question_number).all()
    current_q = None
    if questions:
        last_q = questions[-1]
        current_q = {
            "id": last_q.id,
            "number": last_q.question_number,
            "question": last_q.question_text,
            "skill": last_q.skill,
            "difficulty": last_q.difficulty,
            "type": last_q.question_type,
        }

    return {
        "interview_id": interview.id,
        "role": interview.role,
        "experience": interview.experience,
        "status": interview.status,
        "current_question_number": interview.current_question_number,
        "question_limit": interview.question_limit,
        "current_difficulty": interview.current_difficulty,
        "input_mode": interview.input_mode,
        "current_question": current_q,
        "created_at": interview.created_at,
    }


@app.post("/interviews/{interview_id}/start")
def start_interview(
    interview_id: str,
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewORM).filter(InterviewORM.id == interview_id, InterviewORM.user_id == user.sub).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    existing_questions = db.query(QuestionORM).filter(QuestionORM.interview_id == interview_id).order_by(QuestionORM.question_number).all()
    if existing_questions:
        first_q = existing_questions[0]
        return {
            "interview_id": interview.id,
            "status": interview.status,
            "current_difficulty": interview.current_difficulty,
            "first_question": {
                "id": first_q.id,
                "number": first_q.question_number,
                "question": first_q.question_text,
                "skill": first_q.skill,
                "difficulty": first_q.difficulty,
                "type": first_q.question_type,
            }
        }

    competencies = json.loads(interview.target_competencies) if interview.target_competencies else ["Core Principles"]
    first_comp = competencies[0]

    q_data = ai_provider.generate_question(
        role=interview.role,
        experience=interview.experience,
        interview_type=interview.interview_type,
        target_competency=first_comp,
        difficulty=interview.current_difficulty,
        questions_already_asked=[],
        current_skill_profile={},
    )

    q_id = f"q_{uuid.uuid4().hex[:8]}"
    new_q = QuestionORM(
        id=q_id,
        interview_id=interview.id,
        question_number=1,
        question_text=q_data["question"],
        skill=q_data["skill"],
        difficulty=q_data["difficulty"],
        question_type=q_data.get("question_type", "technical"),
        expected_concepts_json=json.dumps(q_data.get("expected_concepts", [])),
        reason_for_selection=q_data.get("reason_for_selection"),
        created_at=time.time(),
    )
    db.add(new_q)

    interview.status = "ACTIVE"
    interview.current_question_number = 1
    interview.started_at = time.time()
    db.commit()

    return {
        "interview_id": interview.id,
        "status": "ACTIVE",
        "current_difficulty": interview.current_difficulty,
        "first_question": {
            "id": new_q.id,
            "number": 1,
            "question": new_q.question_text,
            "skill": new_q.skill,
            "difficulty": new_q.difficulty,
            "type": new_q.question_type,
        }
    }


@app.post("/interviews/{interview_id}/answers")
def submit_answer(
    interview_id: str,
    req: SubmitAnswerRequest,
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewORM).filter(InterviewORM.id == interview_id, InterviewORM.user_id == user.sub).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    questions = db.query(QuestionORM).filter(QuestionORM.interview_id == interview_id).order_by(QuestionORM.question_number).all()
    if not questions:
        raise HTTPException(status_code=400, detail="No questions active for interview.")

    current_q = questions[-1]
    if current_q.id != req.questionId and req.questionId:
        # Find matching question
        matched = [q for q in questions if q.id == req.questionId]
        if matched:
            current_q = matched[0]

    # Save answer
    current_q.answer_text = req.answer
    current_q.answered_at = time.time()

    expected_concepts = json.loads(current_q.expected_concepts_json) if current_q.expected_concepts_json else []

    # Evaluate answer
    eval_result = ai_provider.evaluate_answer(
        role=interview.role,
        experience=interview.experience,
        question=current_q.question_text,
        skill=current_q.skill,
        difficulty=current_q.difficulty,
        expected_concepts=expected_concepts,
        candidate_answer=req.answer,
        interview_type=interview.interview_type,
    )
    current_q.evaluation_json = json.dumps(eval_result)

    # Update rolling skill score
    skill_profile = json.loads(interview.skill_profile_json) if interview.skill_profile_json else {}
    skill_score_obj = skill_profile.get(current_q.skill, {"current_score": 7.0, "observation_count": 0})

    raw_score = float(eval_result.get("overall_score", 7.0))
    current_score = skill_score_obj.get("current_score", 7.0)
    new_score = round(current_score * 0.6 + raw_score * 0.4, 1)
    obs_cnt = skill_score_obj.get("observation_count", 0) + 1

    skill_profile[current_q.skill] = {
        "current_score": new_score,
        "previous_score": current_score,
        "observation_count": obs_cnt
    }
    interview.skill_profile_json = json.dumps(skill_profile)

    # Adaptive decision
    prev_diff = current_q.difficulty
    target_competencies = json.loads(interview.target_competencies) if interview.target_competencies else [current_q.skill]

    raw_score = float(eval_result.get("overall_score", 7.0))
    score_100 = int(round(raw_score * 10)) if raw_score <= 10.0 else int(round(raw_score))

    if score_100 >= 75:
        level = "STRONG"
        action = "INCREASE_DIFFICULTY"
        next_diff = min(5, prev_diff + 1)
        next_comp = current_q.skill
        reason = f"Strong answer ({score_100}/100); increasing complexity to difficulty {next_diff}"
    elif score_100 >= 45:
        level = "MEDIUM"
        action = "MAINTAIN_DIFFICULTY"
        next_diff = prev_diff
        next_comp = current_q.skill
        reason = f"Medium answer ({score_100}/100); maintaining difficulty level {next_diff} for related concepts"
    else:
        level = "WEAK"
        action = "DECREASE_DIFFICULTY"
        next_diff = max(1, prev_diff - 1)
        next_comp = current_q.skill
        reason = f"Weak answer ({score_100}/100); reducing difficulty to {next_diff} for foundational concepts"

    if interview.current_question_number >= interview.question_limit:
        action = "END_INTERVIEW"
        reason = f"Configured question limit reached ({interview.question_limit} questions). Synthesizing report."

    current_q.agent_decision = action

    if action == "END_INTERVIEW":
        interview.status = "COMPLETED"
        interview.completed_at = time.time()

        # Generate report
        all_evals = []
        for q in questions:
            q_eval = json.loads(q.evaluation_json) if q.evaluation_json else {}
            all_evals.append({"number": q.question_number, "skill": q.skill, "evaluation": q_eval})

        report_res = ai_provider.generate_final_report(
            role=interview.role,
            experience=interview.experience,
            questions_history=all_evals,
            skill_profile=skill_profile,
            candidate_name=user.name,
        )
        interview.readiness_score = report_res["interview_readiness_score"]
        interview.final_report_json = json.dumps(report_res)
        db.commit()

        diff_labels = {1: "foundational", 2: "easy", 3: "medium", 4: "hard", 5: "expert"}
        print(f"\nADAPTIVE_DECISION:\nscore={score_100}\nlevel={level}\nprevious_skill={current_q.skill}\nnext_difficulty={diff_labels.get(next_diff, 'medium')}\nreason=\"{reason}\"\nselected_question_id=COMPLETED\n", flush=True)

        return {
            "accepted": True,
            "interview_status": "COMPLETED",
            "completed": True,
            "next_question": None,
            "report_ready": True,
            "debug_info": {
                "previous_score": raw_score,
                "score_100": score_100,
                "level": level,
                "skill": current_q.skill,
                "current_rolling_skill_score": new_score,
                "difficulty": f"{prev_diff} -> {next_diff}",
                "decision": action,
                "reason": reason,
                "ai_engine": ai_provider.engine_name,
                "mode": "LOCAL AGENTIC",
            }
        }

    # Generate Next Question
    interview.current_difficulty = next_diff
    next_q_num = interview.current_question_number + 1

    existing_asked = [q.question_text for q in questions]
    next_q_data = ai_provider.generate_question(
        role=interview.role,
        experience=interview.experience,
        interview_type=interview.interview_type,
        target_competency=next_comp,
        difficulty=next_diff,
        questions_already_asked=existing_asked,
        current_skill_profile={k: v["current_score"] for k, v in skill_profile.items()},
    )

    next_q_id = f"q_{uuid.uuid4().hex[:8]}"
    next_q = QuestionORM(
        id=next_q_id,
        interview_id=interview.id,
        question_number=next_q_num,
        question_text=next_q_data["question"],
        skill=next_q_data["skill"],
        difficulty=next_q_data["difficulty"],
        question_type=next_q_data.get("question_type", "technical"),
        expected_concepts_json=json.dumps(next_q_data.get("expected_concepts", [])),
        reason_for_selection=next_q_data.get("reason_for_selection"),
        created_at=time.time(),
    )
    db.add(next_q)
    interview.current_question_number = next_q_num
    db.commit()

    diff_labels = {1: "foundational", 2: "easy", 3: "medium", 4: "hard", 5: "expert"}
    next_diff_label = diff_labels.get(next_diff, "medium")

    print(f"\nADAPTIVE_DECISION:\nscore={score_100}\nlevel={level}\nprevious_skill={current_q.skill}\nnext_difficulty={next_diff_label}\nreason=\"{reason}\"\nselected_question_id={next_q_id}\n", flush=True)

    return {
        "accepted": True,
        "interview_status": "ACTIVE",
        "completed": False,
        "next_question": {
            "id": next_q.id,
            "number": next_q_num,
            "question": next_q.question_text,
            "skill": next_q.skill,
            "difficulty": next_q.difficulty,
            "type": next_q.question_type,
        },
        "debug_info": {
            "previous_score": raw_score,
            "score_100": score_100,
            "level": level,
            "skill": current_q.skill,
            "current_rolling_skill_score": new_score,
            "difficulty": f"{prev_diff} -> {next_diff}",
            "decision": action,
            "reason": reason,
            "next_competency": next_comp,
            "selected_question_id": next_q_id,
            "ai_engine": ai_provider.engine_name,
            "mode": "LOCAL AGENTIC",
        }
    }


@app.post("/interviews/{interview_id}/complete")
@app.get("/interviews/{interview_id}/report")
def get_or_complete_report(
    interview_id: str,
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewORM).filter(InterviewORM.id == interview_id, InterviewORM.user_id == user.sub).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    questions = db.query(QuestionORM).filter(QuestionORM.interview_id == interview_id).order_by(QuestionORM.question_number).all()
    skill_profile = json.loads(interview.skill_profile_json) if interview.skill_profile_json else {}

    if not interview.final_report_json:
        all_evals = []
        for q in questions:
            q_eval = json.loads(q.evaluation_json) if q.evaluation_json else {}
            all_evals.append({"number": q.question_number, "skill": q.skill, "evaluation": q_eval})

        report_res = ai_provider.generate_final_report(
            role=interview.role,
            experience=interview.experience,
            questions_history=all_evals,
            skill_profile=skill_profile,
            candidate_name=user.name,
        )
        interview.status = "COMPLETED"
        interview.completed_at = time.time()
        interview.readiness_score = report_res["interview_readiness_score"]
        interview.final_report_json = json.dumps(report_res)
        db.commit()
    else:
        report_res = json.loads(interview.final_report_json)

    history = []
    for q in questions:
        history.append({
            "number": q.question_number,
            "skill": q.skill,
            "difficulty": q.difficulty,
            "question": q.question_text,
            "candidate_answer": q.answer_text,
            "evaluation": json.loads(q.evaluation_json) if q.evaluation_json else None,
        })

    return {
        "interview_id": interview.id,
        "role": interview.role,
        "experience": interview.experience,
        "status": interview.status,
        "readiness_score": interview.readiness_score or 80.0,
        "score_disclaimer": "This score measures performance against this platform's interview rubric and is not a hiring probability.",
        "report": report_res,
        "skill_profile": skill_profile,
        "pdf_download_url": f"http://127.0.0.1:8000/reports/{interview.id}/pdf",
        "questions_history": history,
        "completed_at": interview.completed_at,
    }


@app.delete("/interviews/{interview_id}")
def delete_interview(
    interview_id: str,
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewORM).filter(InterviewORM.id == interview_id, InterviewORM.user_id == user.sub).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    db.query(QuestionORM).filter(QuestionORM.interview_id == interview_id).delete()
    db.delete(interview)
    db.commit()

    return {"deleted": True, "interview_id": interview_id}


@app.post("/interviews/{interview_id}/practice-weaknesses", status_code=status.HTTP_201_CREATED)
def practice_weaknesses(
    interview_id: str,
    req: PracticeWeaknessesRequest,
    user: UserResponse = Depends(get_current_user_profile),
    db: Session = Depends(get_db)
):
    previous = db.query(InterviewORM).filter(InterviewORM.id == interview_id, InterviewORM.user_id == user.sub).first()
    if not previous:
        raise HTTPException(status_code=404, detail="Previous interview not found.")

    weak_skills = []
    if previous.skill_profile_json:
        try:
            prof = json.loads(previous.skill_profile_json)
            sorted_skills = sorted(prof.items(), key=lambda item: item[1].get("current_score", 7.0))
            weak_skills = [item[0] for item in sorted_skills[:3]]
        except Exception:
            pass

    if not weak_skills:
        weak_skills = ["Technical Problem Solving", "System Architecture"]

    new_id = f"int_practice_{uuid.uuid4().hex[:8]}"
    new_interview = InterviewORM(
        id=new_id,
        user_id=user.sub,
        role=previous.role,
        experience=previous.experience,
        interview_type=previous.interview_type,
        question_limit=req.question_limit or 5,
        input_mode=previous.input_mode,
        status="CONFIGURED",
        current_difficulty=max(1, previous.current_difficulty - 1),
        target_competencies=json.dumps(weak_skills),
        skill_profile_json=json.dumps({s: {"current_score": 5.0, "observation_count": 1} for s in weak_skills}),
        created_at=time.time(),
    )
    db.add(new_interview)
    db.commit()

    return {
        "interview_id": new_id,
        "status": "CONFIGURED",
        "targeted_weaknesses": weak_skills,
        "initial_difficulty": new_interview.current_difficulty,
    }


# -----------------------------------------------------------------------------
# 5. Local File Upload & Processing
# -----------------------------------------------------------------------------
@app.post("/documents/process")
async def process_document(
    category: str = Form("job_description"),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: UserResponse = Depends(get_current_user_profile)
):
    text_content = ""
    if raw_text and raw_text.strip():
        text_content = raw_text.strip()
    elif file:
        file_bytes = await file.read()
        text_content = extract_text_from_bytes(file_bytes, file.filename)

        # Save locally under backend/storage/users/{user_id}/
        user_storage = os.path.join(STORAGE_DIR, "users", user.sub)
        os.makedirs(user_storage, exist_ok=True)
        file_path = os.path.join(user_storage, file.filename)
        with open(file_path, "wb") as f:
            f.write(file_bytes)

    if not text_content:
        text_content = "No text content provided."

    analysis = {
        "extracted_skills": ["SQL", "Python", "System Design", "Problem Solving"],
        "word_count": len(text_content.split()),
        "category": category,
    }

    return {
        "text": text_content,
        "analysis": analysis
    }


# -----------------------------------------------------------------------------
# 6. ReportLab PDF Export Endpoint
# -----------------------------------------------------------------------------
@app.get("/reports/{interview_id}/pdf")
def download_pdf_report(
    interview_id: str,
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewORM).filter(InterviewORM.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Report not found.")

    user = db.query(UserORM).filter(UserORM.id == interview.user_id).first()
    candidate_name = user.full_name if user else "Candidate"

    report_data = json.loads(interview.final_report_json) if interview.final_report_json else {}
    skill_profile = json.loads(interview.skill_profile_json) if interview.skill_profile_json else {}
    questions = db.query(QuestionORM).filter(QuestionORM.interview_id == interview_id).order_by(QuestionORM.question_number).all()

    q_list = []
    for q in questions:
        q_list.append({
            "number": q.question_number,
            "skill": q.skill,
            "question": q.question_text,
            "candidate_answer": q.answer_text,
            "evaluation": json.loads(q.evaluation_json) if q.evaluation_json else {}
        })

    pdf_bytes = generate_simple_pdf_bytes(
        candidate_name=candidate_name,
        role=interview.role,
        experience=interview.experience,
        readiness_score=interview.readiness_score or 82.0,
        skill_profile=skill_profile,
        report_data=report_data,
        questions=q_list,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=assessment_report_{interview_id}.pdf"
        }
    )
