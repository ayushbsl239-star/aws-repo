"""
Amazon DynamoDB Single-Table Service.
Stores user profile, interviews, questions, and skill state with clean primary/sort key design.
Access Patterns:
- User Interviews: PK = USER#{user_sub}, SK = INTERVIEW#{interview_id}
- Interview Details: PK = USER#{user_sub}, SK = INTERVIEW#{interview_id}
- Single Question: PK = INTERVIEW#{interview_id}, SK = QUESTION#{question_number}
"""
from decimal import Decimal
import json
import os
import time
from typing import Any, Dict, List, Optional
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from backend.models.interview import InterviewModel, InterviewStatus, QuestionModel, SkillScore
from backend.utils.errors import AppError, ForbiddenError, NotFoundError
from backend.utils.logger import logger


def float_to_decimal(obj: Any) -> Any:
    """Recursively converts floats to Decimal for DynamoDB serialization."""
    if isinstance(obj, float):
        return Decimal(str(round(obj, 4)))
    elif isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [float_to_decimal(item) for item in obj]
    return obj


def decimal_to_float(obj: Any) -> Any:
    """Recursively converts Decimal to float/int for JSON serialization."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(item) for item in obj]
    return obj


class DynamoDBService:
    def __init__(self):
        self.region = os.environ.get("AWS_REGION", "us-east-1")
        self.table_name = os.environ.get("DYNAMODB_TABLE", "ai-interview-coach-table")
        dynamodb = boto3.resource("dynamodb", region_name=self.region)
        self.table = dynamodb.Table(self.table_name)

    def save_interview(self, interview: InterviewModel) -> None:
        """Saves interview metadata and state to single-table."""
        pk = f"USER#{interview.owner_sub}"
        sk = f"INTERVIEW#{interview.interview_id}"

        # Serialize model
        raw_dict = interview.model_dump()
        item = float_to_decimal(raw_dict)
        item["PK"] = pk
        item["SK"] = sk
        item["GSI1PK"] = f"ROLE#{interview.role}"
        item["GSI1SK"] = str(interview.created_at)

        try:
            self.table.put_item(Item=item)
            logger.info("Saved interview to DynamoDB", extra={"interview_id": interview.interview_id})
        except ClientError as ce:
            logger.error(f"Failed to put interview into DynamoDB: {str(ce)}")
            raise AppError("DYNAMODB_ERROR", "Could not persist interview state.")

    def get_interview(self, interview_id: str, user_sub: str) -> InterviewModel:
        """Retrieves interview and validates user sub ownership."""
        pk = f"USER#{user_sub}"
        sk = f"INTERVIEW#{interview_id}"

        try:
            response = self.table.get_item(Key={"PK": pk, "SK": sk})
            item = response.get("Item")
            if not item:
                raise NotFoundError(f"Interview {interview_id} not found.")

            clean_item = decimal_to_float(item)
            return InterviewModel.model_validate(clean_item)
        except ClientError as ce:
            logger.error(f"Error fetching interview {interview_id}: {str(ce)}")
            raise AppError("DYNAMODB_ERROR", "Database fetch failure.")

    def list_user_interviews(self, user_sub: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Lists all interviews owned by user_sub sorted by recency."""
        pk = f"USER#{user_sub}"
        try:
            response = self.table.query(
                KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("INTERVIEW#"),
                ScanIndexForward=False,
                Limit=limit,
            )
            items = response.get("Items", [])
            clean_items = decimal_to_float(items)

            summaries = []
            for item in clean_items:
                summaries.append({
                    "interview_id": item.get("interview_id"),
                    "role": item.get("role"),
                    "experience": item.get("experience"),
                    "interview_type": item.get("interview_type"),
                    "status": item.get("status"),
                    "question_limit": item.get("question_limit"),
                    "current_question_number": item.get("current_question_number"),
                    "readiness_score": item.get("readiness_score"),
                    "created_at": item.get("created_at"),
                    "completed_at": item.get("completed_at"),
                })
            return summaries
        except ClientError as ce:
            logger.error(f"Error querying interviews for user {user_sub}: {str(ce)}")
            raise AppError("DYNAMODB_ERROR", "Failed to list user interviews.")

    def delete_interview(self, interview_id: str, user_sub: str) -> None:
        """Deletes an interview item verifying ownership."""
        pk = f"USER#{user_sub}"
        sk = f"INTERVIEW#{interview_id}"

        try:
            # Check existence first
            self.get_interview(interview_id, user_sub)
            self.table.delete_item(Key={"PK": pk, "SK": sk})
            logger.info("Deleted interview", extra={"interview_id": interview_id})
        except ClientError as ce:
            logger.error(f"Failed to delete interview {interview_id}: {str(ce)}")
            raise AppError("DYNAMODB_ERROR", "Could not delete interview.")

    def get_dashboard_summary(self, user_sub: str) -> Dict[str, Any]:
        """Calculates aggregated metrics, strongest skills, and progress trends across completed interviews."""
        interviews = self.list_user_interviews(user_sub, limit=50)
        completed = [i for i in interviews if i.get("status") == InterviewStatus.COMPLETED.value]

        total_completed = len(completed)
        avg_score = 0.0
        strongest_skill = None
        weakest_skill = None
        trend = []

        if completed:
            scores = [i.get("readiness_score", 0.0) for i in completed if i.get("readiness_score") is not None]
            if scores:
                avg_score = round(sum(scores) / len(scores), 1)

            # Trend by date
            sorted_completed = sorted(completed, key=lambda x: x.get("created_at", 0))
            for idx, c in enumerate(sorted_completed[-8:]):
                trend.append({
                    "interviewNumber": idx + 1,
                    "role": c.get("role"),
                    "score": c.get("readiness_score", 0.0),
                    "date": time.strftime("%d %b", time.localtime(c.get("created_at", time.time()))),
                })

            # Fetch latest completed full interview for detailed skill metrics
            try:
                latest_full = self.get_interview(completed[0]["interview_id"], user_sub)
                if latest_full.skill_profile:
                    sorted_skills = sorted(
                        latest_full.skill_profile.items(),
                        key=lambda item: item[1].current_score,
                        reverse=True
                    )
                    strongest_skill = f"{sorted_skills[0][0]} ({sorted_skills[0][1].current_score}/10)"
                    weakest_skill = f"{sorted_skills[-1][0]} ({sorted_skills[-1][1].current_score}/10)"
            except Exception:
                pass

        return {
            "total_interviews_completed": total_completed,
            "average_readiness_score": avg_score,
            "strongest_skill": strongest_skill or "N/A",
            "primary_improvement_area": weakest_skill or "N/A",
            "progress_trend": trend,
            "recent_interviews": interviews[:6],
        }
