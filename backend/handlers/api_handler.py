"""
Main API Gateway Lambda Handler and Router for AI Adaptive Interview Coach.
Implements all REST endpoints with Cognito auth, CORS, error formatting, and DynamoDB persistence.
"""
import json
import os
import time
import uuid
from typing import Any, Dict, List, Optional

from backend.handlers.auth_middleware import extract_authenticated_user
from backend.models.api_schemas import (
    CreateInterviewRequest,
    PracticeWeaknessesRequest,
    PresignRequest,
    ProcessDocumentRequest,
    SubmitAnswerRequest,
)
from backend.models.interview import (
    InputMode,
    InterviewModel,
    InterviewStatus,
    InterviewType,
    QuestionModel,
    QuestionType,
)
from backend.services.adaptive.engine import AdaptiveEngine
from backend.services.adaptive.skill_profile import update_skill_score
from backend.services.agent.orchestrator import AgentOrchestrator
from backend.services.bedrock.client import BedrockConverseClient
from backend.services.documents.parser import extract_text_from_bytes
from backend.services.reports.generator import ReportGenerator
from backend.services.storage.dynamodb import DynamoDBService
from backend.services.storage.s3_client import S3Service
from backend.services.voice.polly import PollyService
from backend.services.voice.transcribe import TranscribeService
from backend.utils.errors import (
    AppError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    format_error_response,
)
from backend.utils.logger import logger

# Role default competency maps
ROLE_DEFAULT_COMPETENCIES = {
    "software engineer": ["Data Structures & Algorithms", "System Design", "Coding Quality", "Debugging", "Communication"],
    "data analyst": ["SQL", "Python", "Data Visualization", "Statistics", "Business Acumen", "Problem Solving"],
    "product manager": ["Product Strategy", "User Research", "Prioritization", "Metrics & Analytics", "Stakeholder Communication"],
    "cloud engineer": ["AWS Architecture", "Infrastructure as Code", "Security & IAM", "Networking", "DevOps & CI/CD"],
    "cybersecurity analyst": ["Threat Modeling", "Incident Response", "Vulnerability Management", "Network Security", "Compliance"],
    "data scientist": ["Machine Learning", "Model Evaluation", "Feature Engineering", "Python/Pandas", "Statistical Inference"],
    "devops engineer": ["Containerization & Kubernetes", "CI/CD Pipelines", "Monitoring & Observability", "Terraform/CDK", "Linux Internals"],
}

# Service Singletons
_bedrock = None
_dynamodb = None
_s3 = None
_adaptive = None
_orchestrator = None
_report_gen = None
_transcribe = None
_polly = None


def get_services():
    global _bedrock, _dynamodb, _s3, _adaptive, _orchestrator, _report_gen, _transcribe, _polly
    if _bedrock is None:
        _bedrock = BedrockConverseClient()
    if _dynamodb is None:
        _dynamodb = DynamoDBService()
    if _s3 is None:
        _s3 = S3Service()
    if _adaptive is None:
        _adaptive = AdaptiveEngine()
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator(_adaptive)
    if _report_gen is None:
        _report_gen = ReportGenerator(_bedrock, _dynamodb, _s3)
    if _transcribe is None:
        _transcribe = TranscribeService()
    if _polly is None:
        _polly = PollyService()
    return _bedrock, _dynamodb, _s3, _adaptive, _orchestrator, _report_gen, _transcribe, _polly


def json_response(status_code: int, body: Any) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,x-mock-user-sub",
        },
        "body": json.dumps(body),
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """AWS Lambda entrypoint for API Gateway requests."""
    http_method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "GET")
    raw_path = event.get("path") or event.get("rawPath", "/")
    
    # Handle CORS preflight
    if http_method == "OPTIONS":
        return json_response(200, {"status": "ok"})

    start_time = time.time()
    req_id = getattr(context, "aws_request_id", str(uuid.uuid4()))

    try:
        bedrock, dynamodb, s3, adaptive, orchestrator, report_gen, transcribe, polly = get_services()

        # Public health check
        if raw_path == "/health" or raw_path.endswith("/health"):
            return json_response(200, {
                "status": "healthy",
                "service": "ai-adaptive-interview-coach",
                "timestamp": time.time(),
                "agentic_mode": orchestrator.agentic_mode,
                "model_id": bedrock.model_id,
            })

        # All protected routes require valid Cognito authentication
        user = extract_authenticated_user(event)
        body = {}
        if event.get("body"):
            try:
                body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]
            except Exception:
                raise ValidationError("Malformed JSON request body.")

        # -------------------------------------------------------------
        # 1. GET /dashboard
        # -------------------------------------------------------------
        if raw_path.endswith("/dashboard") and http_method == "GET":
            summary = dynamodb.get_dashboard_summary(user.sub)
            return json_response(200, summary)

        # -------------------------------------------------------------
        # 2. POST /interviews (Setup Wizard)
        # -------------------------------------------------------------
        elif (raw_path.endswith("/interviews") or raw_path == "/interviews") and http_method == "POST":
            req = CreateInterviewRequest.model_validate(body)
            interview_id = uuid.uuid4().hex[:12]

            # Determine initial competencies
            role_key = req.role.lower().strip()
            matched_pool = ROLE_DEFAULT_COMPETENCIES.get(
                role_key, ["Core Technical Principles", "Problem Solving", "System Architecture", "Communication"]
            )
            target_competencies = list(matched_pool)

            jd_analysis_dict = None
            if req.job_description_text:
                try:
                    jd_res = bedrock.analyze_job_description(req.job_description_text)
                    jd_analysis_dict = jd_res.model_dump()
                    if jd_res.required_skills:
                        target_competencies = jd_res.required_skills[:6]
                except Exception as e:
                    logger.warning(f"JD analysis fallback: {str(e)}")

            resume_analysis_dict = None
            if req.resume_text:
                try:
                    res_res = bedrock.analyze_resume(req.resume_text)
                    resume_analysis_dict = res_res.model_dump()
                except Exception as e:
                    logger.warning(f"Resume analysis fallback: {str(e)}")

            interview = InterviewModel(
                interview_id=interview_id,
                owner_sub=user.sub,
                role=req.role,
                experience=req.experience,
                interview_type=InterviewType(req.interview_type.lower()),
                question_limit=req.question_limit,
                input_mode=InputMode(req.input_mode.lower()),
                status=InterviewStatus.CONFIGURED,
                current_difficulty=2,  # Start at standard foundational/applied
                job_description_text=req.job_description_text,
                job_description_s3_key=req.job_description_s3_key,
                jd_analysis=jd_analysis_dict,
                resume_text=req.resume_text,
                resume_s3_key=req.resume_s3_key,
                resume_analysis=resume_analysis_dict,
                target_competencies=target_competencies,
            )
            dynamodb.save_interview(interview)
            return json_response(201, {
                "interview_id": interview.interview_id,
                "status": interview.status.value,
                "target_competencies": target_competencies,
            })

        # -------------------------------------------------------------
        # 3. GET /interviews (List My Interviews)
        # -------------------------------------------------------------
        elif (raw_path.endswith("/interviews") or raw_path == "/interviews") and http_method == "GET":
            interviews = dynamodb.list_user_interviews(user.sub)
            return json_response(200, {"interviews": interviews})

        # -------------------------------------------------------------
        # 4. POST /documents/presign (S3 upload authorization)
        # -------------------------------------------------------------
        elif raw_path.endswith("/documents/presign") and http_method == "POST":
            req = PresignRequest.model_validate(body)
            result = s3.generate_presigned_upload(
                user_sub=user.sub,
                category=req.category,
                file_name=req.file_name,
                content_type=req.file_type,
            )
            return json_response(200, result)

        # -------------------------------------------------------------
        # 5. POST /documents/process (Extract text from uploaded S3 file)
        # -------------------------------------------------------------
        elif raw_path.endswith("/documents/process") and http_method == "POST":
            req = ProcessDocumentRequest.model_validate(body)
            if req.raw_text:
                text_content = req.raw_text
            else:
                file_bytes = s3.get_file_bytes(user.sub, req.s3_key)
                text_content = extract_text_from_bytes(file_bytes, req.s3_key)

            if req.category == "job_description":
                analysis = bedrock.analyze_job_description(text_content).model_dump()
            else:
                analysis = bedrock.analyze_resume(text_content).model_dump()

            return json_response(200, {
                "text": text_content,
                "analysis": analysis,
            })

        # -------------------------------------------------------------
        # 6. POST /voice/presign & /voice/transcribe & /voice/synthesize
        # -------------------------------------------------------------
        elif raw_path.endswith("/voice/presign") and http_method == "POST":
            file_name = body.get("file_name", "audio_answer.webm")
            result = s3.generate_presigned_upload(
                user_sub=user.sub,
                category="voice",
                file_name=file_name,
                content_type="audio/webm",
            )
            return json_response(200, result)

        elif raw_path.endswith("/voice/transcribe") and http_method == "POST":
            s3_key = body.get("s3_key")
            if not s3_key:
                raise ValidationError("s3_key is required for audio transcription.")
            job_name = transcribe.start_transcription_job(s3_key)
            return json_response(200, {"job_name": job_name, "status": "IN_PROGRESS"})

        elif "/voice/transcriptions/" in raw_path and http_method == "GET":
            job_name = raw_path.split("/")[-1]
            result = transcribe.get_transcription_result(job_name)
            return json_response(200, result)

        elif raw_path.endswith("/voice/synthesize") and http_method == "POST":
            text = body.get("text", "")
            if not text:
                raise ValidationError("Text required for speech synthesis.")
            audio_data = polly.synthesize_question_audio(text)
            return json_response(200, audio_data)

        # -------------------------------------------------------------
        # 7. INTERVIEW ID SPECIFIC ROUTES: /interviews/{id}/...
        # -------------------------------------------------------------
        path_parts = [p for p in raw_path.split("/") if p]
        if "interviews" in path_parts:
            int_idx = path_parts.index("interviews")
            if len(path_parts) > int_idx + 1:
                interview_id = path_parts[int_idx + 1]
                sub_action = path_parts[int_idx + 2] if len(path_parts) > int_idx + 2 else None

                # DELETE /interviews/{id}
                if http_method == "DELETE" and not sub_action:
                    dynamodb.delete_interview(interview_id, user.sub)
                    return json_response(200, {"deleted": True, "interview_id": interview_id})

                # GET /interviews/{id} (State restoration / active session)
                if http_method == "GET" and not sub_action:
                    interview = dynamodb.get_interview(interview_id, user.sub)
                    current_q = interview.questions[-1].to_client_dict() if interview.questions else None
                    return json_response(200, {
                        "interview_id": interview.interview_id,
                        "role": interview.role,
                        "experience": interview.experience,
                        "status": interview.status.value,
                        "current_question_number": interview.current_question_number,
                        "question_limit": interview.question_limit,
                        "current_difficulty": interview.current_difficulty,
                        "input_mode": interview.input_mode.value,
                        "current_question": current_q,
                        "created_at": interview.created_at,
                    })

                # POST /interviews/{id}/start
                if http_method == "POST" and sub_action == "start":
                    interview = dynamodb.get_interview(interview_id, user.sub)
                    if interview.status != InterviewStatus.CONFIGURED and interview.questions:
                        # Idempotent re-start: return existing question
                        first_q = interview.questions[0].to_client_dict()
                        return json_response(200, {
                            "interview_id": interview.interview_id,
                            "status": interview.status.value,
                            "current_difficulty": interview.current_difficulty,
                            "first_question": first_q,
                        })

                    initial_competency = (
                        interview.target_competencies[0] if interview.target_competencies else "Core Principles"
                    )

                    # Generate first question with Bedrock
                    q_output = bedrock.generate_question(
                        role=interview.role,
                        experience=interview.experience,
                        interview_type=interview.interview_type.value,
                        target_competency=initial_competency,
                        difficulty=interview.current_difficulty,
                        questions_already_asked=[],
                        current_skill_profile={},
                        jd_context=interview.jd_analysis,
                        resume_context=interview.resume_analysis,
                    )

                    q_model = QuestionModel(
                        question_id=f"q_{uuid.uuid4().hex[:8]}",
                        question_number=1,
                        question_text=q_output.question,
                        skill=q_output.skill,
                        difficulty=q_output.difficulty,
                        question_type=QuestionType(q_output.question_type) if q_output.question_type in [e.value for e in QuestionType] else QuestionType.TECHNICAL,
                        expected_concepts=q_output.expected_concepts,
                        reason_for_selection=q_output.reason_for_selection,
                    )

                    interview.questions = [q_model]
                    interview.current_question_number = 1
                    interview.status = InterviewStatus.ACTIVE
                    interview.started_at = time.time()
                    dynamodb.save_interview(interview)

                    return json_response(200, {
                        "interview_id": interview.interview_id,
                        "status": interview.status.value,
                        "current_difficulty": interview.current_difficulty,
                        "first_question": q_model.to_client_dict(),
                    })

                # POST /interviews/{id}/answers
                if http_method == "POST" and sub_action == "answers":
                    req = SubmitAnswerRequest.model_validate(body)
                    interview = dynamodb.get_interview(interview_id, user.sub)

                    if interview.status != InterviewStatus.ACTIVE:
                        raise ConflictError("Interview is not currently active.")

                    if not interview.questions:
                        raise ConflictError("No active question found to answer.")

                    current_q = interview.questions[-1]
                    if current_q.question_id != req.question_id:
                        raise ConflictError("Submitted answer does not match current active question.")

                    # Prevent duplicate submissions
                    if current_q.answer_text is not None:
                        raise ConflictError("An answer has already been submitted for this question.")

                    # 1. Record candidate answer
                    current_q.answer_text = req.answer
                    current_q.answered_at = time.time()

                    # 2. Evaluate with Bedrock Runtime Converse API
                    evaluation = bedrock.evaluate_answer(
                        role=interview.role,
                        experience=interview.experience,
                        question=current_q.question_text,
                        skill=current_q.skill,
                        difficulty=current_q.difficulty,
                        expected_concepts=current_q.expected_concepts,
                        candidate_answer=req.answer,
                        interview_type=interview.interview_type.value,
                    )
                    current_q.evaluation = evaluation.model_dump()

                    # 3. Update candidate rolling skill score
                    updated_skill = update_skill_score(
                        skill_name=current_q.skill,
                        new_raw_score=evaluation.overall_score,
                        confidence=evaluation.confidence,
                        current_profile=interview.skill_profile,
                    )

                    # 4. Decide next action (AgentCore or Deterministic Adaptive Engine)
                    decision = orchestrator.decide_next_action(
                        interview=interview,
                        user_sub=user.sub,
                        latest_evaluation=evaluation,
                    )
                    current_q.agent_decision = decision.action

                    # 5. Check completion condition
                    if decision.action == "END_INTERVIEW":
                        report_data = report_gen.generate_and_save_report(interview, candidate_name=user.name)
                        return json_response(200, {
                            "accepted": True,
                            "interview_status": InterviewStatus.COMPLETED.value,
                            "completed": True,
                            "next_question": None,
                            "report_ready": True,
                            "debug_info": {
                                "action": decision.action,
                                "reason": decision.reason,
                                "mode": "AGENTIC" if orchestrator.agentic_mode else "DETERMINISTIC",
                                "score": evaluation.overall_score,
                                "skill": current_q.skill,
                                "difficulty": current_q.difficulty,
                            }
                        })

                    # 6. Generate Next Question
                    interview.current_difficulty = decision.next_difficulty
                    next_q_num = interview.current_question_number + 1

                    if decision.is_follow_up:
                        next_q_output = bedrock.generate_follow_up(
                            role=interview.role,
                            previous_question=current_q.question_text,
                            candidate_answer=req.answer,
                            follow_up_reason=decision.follow_up_reason or "Probing trade-offs",
                            skill=decision.next_competency,
                            difficulty=decision.next_difficulty,
                        )
                    else:
                        existing_texts = [q.question_text for q in interview.questions]
                        profile_scores = {k: v.current_score for k, v in interview.skill_profile.items()}
                        next_q_output = bedrock.generate_question(
                            role=interview.role,
                            experience=interview.experience,
                            interview_type=interview.interview_type.value,
                            target_competency=decision.next_competency,
                            difficulty=decision.next_difficulty,
                            questions_already_asked=existing_texts,
                            current_skill_profile=profile_scores,
                            jd_context=interview.jd_analysis,
                            resume_context=interview.resume_analysis,
                        )

                    next_q_model = QuestionModel(
                        question_id=f"q_{uuid.uuid4().hex[:8]}",
                        question_number=next_q_num,
                        question_text=next_q_output.question,
                        skill=next_q_output.skill,
                        difficulty=next_q_output.difficulty,
                        question_type=QuestionType.FOLLOW_UP if decision.is_follow_up else QuestionType.TECHNICAL,
                        expected_concepts=next_q_output.expected_concepts,
                        reason_for_selection=next_q_output.reason_for_selection or decision.reason,
                    )

                    interview.questions.append(next_q_model)
                    interview.current_question_number = next_q_num
                    dynamodb.save_interview(interview)

                    # Return next question without exposing expected rubrics
                    return json_response(200, {
                        "accepted": True,
                        "interview_status": InterviewStatus.ACTIVE.value,
                        "completed": False,
                        "next_question": next_q_model.to_client_dict(),
                        "debug_info": {
                            "previous_score": evaluation.overall_score,
                            "skill": current_q.skill,
                            "current_rolling_skill_score": updated_skill.current_score,
                            "difficulty": f"{current_q.difficulty} -> {decision.next_difficulty}",
                            "decision": decision.action,
                            "reason": decision.reason,
                            "ai_confidence": evaluation.confidence,
                            "mode": "AGENTIC" if orchestrator.agentic_mode else "DETERMINISTIC",
                            "next_competency": decision.next_competency,
                        }
                    })

                # POST /interviews/{id}/complete
                if http_method == "POST" and sub_action == "complete":
                    interview = dynamodb.get_interview(interview_id, user.sub)
                    report_result = report_gen.generate_and_save_report(interview, candidate_name=user.name)
                    return json_response(200, report_result)

                # GET /interviews/{id}/report
                if http_method == "GET" and sub_action == "report":
                    interview = dynamodb.get_interview(interview_id, user.sub)
                    if interview.status != InterviewStatus.COMPLETED or not interview.final_report:
                        # Auto-synthesize report if questions were answered
                        if interview.questions:
                            return json_response(200, report_gen.generate_and_save_report(interview, candidate_name=user.name))
                        raise ConflictError("Interview has not been completed yet.")

                    download_url = None
                    if interview.final_report_s3_key:
                        try:
                            download_url = s3.generate_presigned_download(
                                user_sub=interview.owner_sub,
                                s3_key=interview.final_report_s3_key,
                                expires_in=3600,
                            )
                        except Exception:
                            pass

                    # Compile question evaluations
                    history = []
                    for q in interview.questions:
                        history.append({
                            "number": q.question_number,
                            "skill": q.skill,
                            "difficulty": q.difficulty,
                            "question": q.question_text,
                            "candidate_answer": q.answer_text,
                            "evaluation": q.evaluation,
                        })

                    skill_profile_dict = {
                        k: {"current_score": v.current_score, "observations": v.observation_count}
                        for k, v in interview.skill_profile.items()
                    }

                    return json_response(200, {
                        "interview_id": interview.interview_id,
                        "role": interview.role,
                        "experience": interview.experience,
                        "status": interview.status.value,
                        "readiness_score": interview.readiness_score,
                        "score_disclaimer": "This score reflects performance against this platform's interview rubric. It is not a hiring probability.",
                        "report": interview.final_report,
                        "skill_profile": skill_profile_dict,
                        "pdf_download_url": download_url,
                        "questions_history": history,
                        "completed_at": interview.completed_at,
                    })

                # POST /interviews/{id}/practice-weaknesses
                if http_method == "POST" and sub_action == "practice-weaknesses":
                    previous = dynamodb.get_interview(interview_id, user.sub)
                    weak_competencies = []
                    if previous.skill_profile:
                        sorted_skills = sorted(
                            previous.skill_profile.items(),
                            key=lambda item: item[1].current_score
                        )
                        weak_competencies = [item[0] for item in sorted_skills[:3]]

                    if not weak_competencies:
                        weak_competencies = previous.target_competencies[:2]

                    new_interview_id = uuid.uuid4().hex[:12]
                    new_interview = InterviewModel(
                        interview_id=new_interview_id,
                        owner_sub=user.sub,
                        role=previous.role,
                        experience=previous.experience,
                        interview_type=previous.interview_type,
                        question_limit=body.get("question_limit", 5),
                        input_mode=previous.input_mode,
                        status=InterviewStatus.CONFIGURED,
                        current_difficulty=max(1, previous.current_difficulty - 1),
                        target_competencies=weak_competencies,
                    )
                    dynamodb.save_interview(new_interview)
                    return json_response(201, {
                        "interview_id": new_interview.interview_id,
                        "status": new_interview.status.value,
                        "targeted_weaknesses": weak_competencies,
                        "initial_difficulty": new_interview.current_difficulty,
                    })

        raise NotFoundError(f"Route not found: {http_method} {raw_path}")

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        logger.error(
            f"API request failed: {str(e)}",
            request_id=req_id,
            latency_ms=latency_ms,
            success=False,
            extra={"path": raw_path, "method": http_method}
        )
        return format_error_response(e)
