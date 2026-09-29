"""
Amazon Polly integration for text-to-speech question synthesis.
Converts generated interview questions into realistic audio using Neural TTS.
"""
import base64
import os
from typing import Dict, Any
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from backend.utils.errors import AppError
from backend.utils.logger import logger


class PollyService:
    def __init__(self):
        self.region = os.environ.get("AWS_REGION", "us-east-1")
        boto_config = Config(region_name=self.region, retries={"max_attempts": 3})
        self.client = boto3.client("polly", config=boto_config)
        self.voice_id = os.environ.get("POLLY_VOICE_ID", "Ruth")

    def synthesize_question_audio(self, text: str) -> Dict[str, Any]:
        """
        Synthesizes text into high-quality neural speech.
        Returns base64-encoded MP3 audio for immediate streaming playback.
        """
        try:
            # SSML formatting to give natural interview pacing
            ssml_text = f"<speak><prosody rate='98%'>{text}</prosody></speak>"
            response = self.client.synthesize_speech(
                Text=ssml_text,
                TextType="ssml",
                OutputFormat="mp3",
                VoiceId=self.voice_id,
                Engine="neural",
            )

            audio_stream = response.get("AudioStream")
            if audio_stream:
                audio_bytes = audio_stream.read()
                b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
                logger.info("Synthesized question audio with Amazon Polly Neural", extra={"bytes": len(audio_bytes)})
                return {
                    "contentType": "audio/mpeg",
                    "audioBase64": b64_audio,
                    "voiceId": self.voice_id,
                }
            raise AppError("POLLY_ERROR", "No audio stream returned.")
        except ClientError as ce:
            logger.error(f"Polly synthesis error: {str(ce)}")
            raise AppError("POLLY_ERROR", "Could not synthesize question audio.")
