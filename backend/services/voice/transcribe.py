"""
Amazon Transcribe integration for push-to-talk speech-to-text.
Starts transcription job on uploaded audio and retrieves text results.
"""
import json
import os
import time
import urllib.request
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from backend.utils.errors import AppError
from backend.utils.logger import logger


class TranscribeService:
    def __init__(self):
        self.region = os.environ.get("AWS_REGION", "us-east-1")
        boto_config = Config(region_name=self.region, retries={"max_attempts": 3})
        self.client = boto3.client("transcribe", config=boto_config)
        self.bucket_name = os.environ.get("DOCUMENT_BUCKET", "ai-interview-coach-docs")

    def start_transcription_job(self, s3_key: str, media_format: str = "webm") -> str:
        """Starts asynchronous transcription job for uploaded voice recording."""
        job_name = f"voice_transcribe_{int(time.time())}_{os.path.basename(s3_key).replace('.', '_')}"
        media_uri = f"s3://{self.bucket_name}/{s3_key}"

        try:
            self.client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={"MediaFileUri": media_uri},
                MediaFormat=media_format,
                LanguageCode="en-US",
                Settings={
                    "ShowSpeakerLabels": False,
                    "ChannelIdentification": False,
                }
            )
            logger.info("Started Transcribe job", extra={"job_name": job_name, "s3_key": s3_key})
            return job_name
        except ClientError as ce:
            logger.error(f"Failed to start Transcribe job: {str(ce)}")
            raise AppError("TRANSCRIBE_ERROR", "Could not start audio transcription.")

    def get_transcription_result(self, job_name: str) -> Dict[str, Any]:
        """Polls transcription job status and extracts transcript text when COMPLETED."""
        try:
            response = self.client.get_transcription_job(TranscriptionJobName=job_name)
            job = response.get("TranscriptionJob", {})
            status = job.get("TranscriptionJobStatus")

            if status == "COMPLETED":
                transcript_file_uri = job.get("Transcript", {}).get("TranscriptFileUri")
                if transcript_file_uri:
                    # Download transcript JSON
                    with urllib.request.urlopen(transcript_file_uri) as res:
                        data = json.loads(res.read().decode("utf-8"))
                        text = data.get("results", {}).get("transcripts", [{}])[0].get("transcript", "")
                        return {"status": "COMPLETED", "transcript": text}
                return {"status": "COMPLETED", "transcript": ""}

            elif status == "FAILED":
                reason = job.get("FailureReason", "Unknown error")
                logger.error(f"Transcribe job failed: {reason}")
                return {"status": "FAILED", "error": reason}

            else:
                return {"status": status, "transcript": None}

        except ClientError as ce:
            logger.error(f"Error fetching transcription job: {str(ce)}")
            raise AppError("TRANSCRIBE_ERROR", "Could not check transcription status.")
