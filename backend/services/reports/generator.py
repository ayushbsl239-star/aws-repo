"""
Final Interview Report and Readiness Score Generator.
Synthesizes candidate evaluations, calculates normalized 0-100 Readiness Score,
orchestrates Bedrock feedback generation, and stores downloadable PDF reports.
"""
import time
from typing import Any, Dict, Optional
from backend.models.interview import InterviewModel, InterviewStatus
from backend.services.bedrock.client import BedrockConverseClient
from backend.services.reports.pdf_export import generate_simple_pdf_bytes
from backend.services.storage.dynamodb import DynamoDBService
from backend.services.storage.s3_client import S3Service
from backend.utils.logger import logger


class ReportGenerator:
    def __init__(
        self,
        bedrock_client: Optional[BedrockConverseClient] = None,
        dynamodb_service: Optional[DynamoDBService] = None,
        s3_service: Optional[S3Service] = None,
    ):
        self.bedrock = bedrock_client or BedrockConverseClient()
        self.dynamodb = dynamodb_service or DynamoDBService()
        self.s3 = s3_service or S3Service()

    def calculate_interview_readiness_score(self, interview: InterviewModel) -> float:
        """
        Calculates normalized Readiness Score (0 to 100) strictly from server-side rubric scores.
        Does NOT allow the LLM to freely invent this overall performance score.
        """
        answered_scores = []
        for q in interview.questions:
            if q.evaluation and "overall_score" in q.evaluation:
                answered_scores.append(float(q.evaluation["overall_score"]))

        if not answered_scores:
            return 50.0

        avg_rubric_score = sum(answered_scores) / len(answered_scores)
        # Normalize 0.0 - 10.0 scale to 0.0 - 100.0
        readiness = round(avg_rubric_score * 10.0, 1)
        return max(0.0, min(100.0, readiness))

    def generate_and_save_report(
        self,
        interview: InterviewModel,
        candidate_name: str = "Candidate",
    ) -> Dict[str, Any]:
        """
        Orchestrates full completion report:
        1. Computes deterministic Readiness Score (0-100)
        2. Synthesizes qualitative coaching insights with Bedrock
        3. Exports and uploads PDF to S3
        4. Persists COMPLETED state into DynamoDB
        """
        readiness_score = self.calculate_interview_readiness_score(interview)
        interview.readiness_score = readiness_score

        # Prepare evaluation summary for Bedrock synthesis
        evaluations_summary = []
        for q in interview.questions:
            evaluations_summary.append({
                "number": q.question_number,
                "skill": q.skill,
                "difficulty": q.difficulty,
                "question": q.question_text,
                "candidate_answer": q.answer_text or "",
                "rubric_scores": {
                    "accuracy": q.evaluation.get("technical_accuracy", 5.0) if q.evaluation else 5.0,
                    "relevance": q.evaluation.get("relevance", 5.0) if q.evaluation else 5.0,
                    "completeness": q.evaluation.get("completeness", 5.0) if q.evaluation else 5.0,
                    "communication": q.evaluation.get("communication", 5.0) if q.evaluation else 5.0,
                    "problem_solving": q.evaluation.get("problem_solving", 5.0) if q.evaluation else 5.0,
                    "overall": q.evaluation.get("overall_score", 5.0) if q.evaluation else 5.0,
                },
                "strengths": q.evaluation.get("strengths", []) if q.evaluation else [],
                "weaknesses": q.evaluation.get("weaknesses", []) if q.evaluation else [],
                "missing_concepts": q.evaluation.get("missing_concepts", []) if q.evaluation else [],
            })

        skill_profile_dict = {
            k: {"current_score": v.current_score, "observations": v.observation_count}
            for k, v in interview.skill_profile.items()
        }

        # Call Bedrock for structured coaching feedback & 7-day plan
        report_data = self.bedrock.generate_final_report(
            role=interview.role,
            experience=interview.experience,
            readiness_score=readiness_score,
            questions_and_evaluations=evaluations_summary,
            skill_profile=skill_profile_dict,
        )

        # Generate PDF report bytes
        try:
            pdf_bytes = generate_simple_pdf_bytes(
                candidate_name=candidate_name,
                role=interview.role,
                experience=interview.experience,
                readiness_score=readiness_score,
                skill_profile=skill_profile_dict,
                report_data=report_data,
                questions=evaluations_summary,
            )
            report_s3_key = self.s3.put_report_file(
                user_sub=interview.owner_sub,
                interview_id=interview.interview_id,
                content=pdf_bytes,
            )
            download_url = self.s3.generate_presigned_download(
                user_sub=interview.owner_sub,
                s3_key=report_s3_key,
                expires_in=3600,
            )
            interview.final_report_s3_key = report_s3_key
        except Exception as e:
            logger.error(f"Failed to generate/upload PDF report: {str(e)}")
            download_url = None

        # Update interview model
        interview.status = InterviewStatus.COMPLETED
        interview.completed_at = time.time()
        interview.final_report = report_data
        self.dynamodb.save_interview(interview)

        logger.info(
            f"Interview {interview.interview_id} completed with readiness score {readiness_score}",
            extra={"readiness_score": readiness_score, "questions_count": len(interview.questions)}
        )

        return {
            "interview_id": interview.interview_id,
            "status": interview.status.value,
            "readiness_score": readiness_score,
            "score_disclaimer": "This score reflects performance against this platform's interview rubric. It is not a hiring probability.",
            "report": report_data,
            "skill_profile": skill_profile_dict,
            "pdf_download_url": download_url,
            "questions_history": evaluations_summary,
        }
