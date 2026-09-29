"""
Amazon S3 client for presigned upload/download URLs and secure file handling.
Enforces user isolation by prefixing all S3 keys with the candidate's Cognito user sub.
"""
import os
import uuid
from typing import Any, Dict, Optional
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from backend.utils.errors import AppError, ForbiddenError, NotFoundError
from backend.utils.logger import logger


class S3Service:
    def __init__(self):
        self.region = os.environ.get("AWS_REGION", "us-east-1")
        self.bucket_name = os.environ.get("DOCUMENT_BUCKET", "ai-interview-coach-docs")
        
        boto_config = Config(
            region_name=self.region,
            signature_version="s3v4",
            retries={"max_attempts": 3}
        )
        self.client = boto3.client("s3", config=boto_config)

    def generate_presigned_upload(
        self,
        user_sub: str,
        category: str,
        file_name: str,
        content_type: str,
        max_size_bytes: int = 5 * 1024 * 1024,
    ) -> Dict[str, Any]:
        """
        Generates a secure presigned POST URL with content-length restrictions.
        Scope is restricted to users/{user_sub}/{category}/{uuid}_{file_name}.
        """
        clean_filename = os.path.basename(file_name).replace(" ", "_")
        key = f"users/{user_sub}/{category}/{uuid.uuid4().hex[:8]}_{clean_filename}"

        try:
            presigned_post = self.client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=key,
                Fields={"Content-Type": content_type},
                Conditions=[
                    {"Content-Type": content_type},
                    ["content-length-range", 10, max_size_bytes],
                ],
                ExpiresIn=900,  # 15 minutes
            )
            logger.info("Generated presigned upload URL", extra={"key": key, "category": category})
            return {
                "upload_url": presigned_post["url"],
                "s3_key": key,
                "fields": presigned_post["fields"],
            }
        except ClientError as ce:
            logger.error(f"Failed to generate presigned upload URL: {str(ce)}")
            raise AppError("S3_ERROR", "Could not generate upload authorization.")

    def generate_presigned_download(
        self,
        user_sub: str,
        s3_key: str,
        expires_in: int = 900,
    ) -> str:
        """
        Generates a short-lived download URL.
        Enforces user ownership by checking key prefix.
        """
        expected_prefix = f"users/{user_sub}/"
        if not s3_key.startswith(expected_prefix):
            logger.warning(
                f"Ownership violation: user {user_sub} attempted to access {s3_key}"
            )
            raise ForbiddenError("Access to this document is forbidden.")

        try:
            url = self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket_name, "Key": s3_key},
                ExpiresIn=expires_in,
            )
            return url
        except ClientError as ce:
            logger.error(f"Failed to generate download URL: {str(ce)}")
            raise NotFoundError("Requested document not found or inaccessible.")

    def get_file_bytes(self, user_sub: str, s3_key: str) -> bytes:
        """Fetches object bytes securely for server-side parsing."""
        expected_prefix = f"users/{user_sub}/"
        if not s3_key.startswith(expected_prefix):
            raise ForbiddenError("Access to this document is forbidden.")

        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=s3_key)
            return response["Body"].read()
        except ClientError as ce:
            logger.error(f"Error fetching S3 object {s3_key}: {str(ce)}")
            raise NotFoundError("Document not found in storage.")

    def put_report_file(self, user_sub: str, interview_id: str, content: bytes, content_type: str = "application/pdf") -> str:
        """Saves generated report to S3 and returns the s3_key."""
        key = f"users/{user_sub}/reports/{interview_id}_summary.pdf"
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=key,
            Body=content,
            ContentType=content_type,
        )
        return key
