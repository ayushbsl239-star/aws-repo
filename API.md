# AI Adaptive Interview Coach — API Specification
**Amazon API Gateway REST / HTTP API Interface**

---

## Base Headers
All protected routes require an authenticated Amazon Cognito ID or Access token:
```http
Authorization: Bearer <Cognito_JWT_Token>
Content-Type: application/json
```

---

## Public Endpoints

### 1. Health Check
`GET /health`
- **Description:** Verifies service availability, Bedrock model configuration, and Agentic mode.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "service": "ai-adaptive-interview-coach",
  "timestamp": 1790681400.0,
  "agentic_mode": true,
  "model_id": "anthropic.claude-3-5-sonnet-20241022-v2:0"
}
```

---

## Protected Interview Endpoints

### 2. Candidate Dashboard Summary
`GET /dashboard`
- **Description:** Returns aggregated interview statistics, average readiness score, progress trend, and recent sessions.
- **Response `200 OK`:**
```json
{
  "total_interviews_completed": 4,
  "average_readiness_score": 76.5,
  "strongest_skill": "SQL (8.8/10)",
  "primary_improvement_area": "Statistics (5.4/10)",
  "progress_trend": [
    { "interviewNumber": 1, "role": "Data Analyst", "score": 61.0, "date": "12 Sep" },
    { "interviewNumber": 2, "role": "Data Analyst", "score": 68.5, "date": "18 Sep" }
  ],
  "recent_interviews": [ ... ]
}
```

### 3. Create Interview Session (Wizard)
`POST /interviews`
- **Request Body:**
```json
{
  "role": "Data Analyst",
  "experience": "Fresher",
  "interview_type": "mixed",
  "question_limit": 5,
  "input_mode": "text",
  "job_description_text": "Looking for SQL & Python analyst with statistical rigor...",
  "resume_text": "Built churn models and automated ETL dashboards..."
}
```
- **Response `201 Created`:**
```json
{
  "interview_id": "a1b2c3d4e5f6",
  "status": "CONFIGURED",
  "target_competencies": ["SQL", "Statistics", "Problem Solving", "Data Visualization"]
}
```

### 4. Start Interview Session
`POST /interviews/{id}/start`
- **Description:** Generates opening question using Amazon Bedrock Converse API.
- **Response `200 OK`:**
```json
{
  "interview_id": "a1b2c3d4e5f6",
  "status": "ACTIVE",
  "current_difficulty": 2,
  "first_question": {
    "id": "q_78f1a2",
    "number": 1,
    "question": "Can you explain the difference between WHERE and HAVING in SQL?",
    "skill": "SQL",
    "difficulty": 2,
    "type": "technical"
  }
}
```

### 5. Submit Candidate Answer
`POST /interviews/{id}/answers`
- **Request Body:**
```json
{
  "questionId": "q_78f1a2",
  "answer": "WHERE filters individual records before GROUP BY, while HAVING filters aggregated metric groups after grouping."
}
```
- **Response `200 OK` (Continuing Interview):**
```json
{
  "accepted": true,
  "interview_status": "ACTIVE",
  "completed": false,
  "next_question": {
    "id": "q_99a8b1",
    "number": 2,
    "question": "How would you optimize a query joining 50 million transaction rows that is timing out?",
    "skill": "SQL",
    "difficulty": 3,
    "type": "scenario"
  },
  "debug_info": {
    "previous_score": 8.9,
    "skill": "SQL",
    "current_rolling_skill_score": 8.9,
    "difficulty": "2 -> 3",
    "decision": "INCREASE_DIFFICULTY",
    "reason": "Strong answer (8.9/10). Relational join algebra verified; escalating to query optimization.",
    "ai_confidence": 0.95,
    "mode": "AGENTIC",
    "next_competency": "SQL Optimization"
  }
}
```

### 6. Get Assessment Report
`GET /interviews/{id}/report`
- **Response `200 OK`:**
```json
{
  "interview_id": "a1b2c3d4e5f6",
  "role": "Data Analyst",
  "experience": "Fresher",
  "status": "COMPLETED",
  "readiness_score": 82.5,
  "score_disclaimer": "This score reflects performance against this platform's interview rubric. It is not a hiring probability.",
  "report": {
    "executive_summary": "...",
    "strengths": [ ... ],
    "key_development_areas": [ ... ],
    "competency_breakdown": { ... },
    "question_improvements": [ ... ],
    "personalized_improvement_plan": {
      "top_3_priorities": [ ... ],
      "study_topics": [ ... ],
      "seven_day_schedule": [ ... ]
    }
  },
  "skill_profile": {
    "SQL": { "current_score": 8.8, "observations": 3 },
    "Statistics": { "current_score": 5.4, "observations": 2 }
  },
  "pdf_download_url": "https://s3.amazonaws.com/...presigned..."
}
```

### 7. Practice Weak Areas Drill
`POST /interviews/{id}/practice-weaknesses`
- **Request Body:** `{ "question_limit": 5 }`
- **Response `201 Created`:**
```json
{
  "interview_id": "w8k9j2l1",
  "status": "CONFIGURED",
  "targeted_weaknesses": ["Statistics", "Communication"],
  "initial_difficulty": 1
}
```

---

## Document & Voice Endpoints

### 8. Presign S3 Document Upload
`POST /documents/presign`
- **Request Body:** `{ "file_name": "resume.pdf", "file_type": "application/pdf", "category": "resume" }`
- **Response `200 OK`:** Returns `{ upload_url, s3_key, fields }`.

### 9. Process Uploaded Document
`POST /documents/process`
- **Request Body:** `{ "s3_key": "users/.../resume.pdf", "category": "resume" }`
- **Response `200 OK`:** Returns `{ text, analysis }`.

### 10. Synthesize Question Speech (Amazon Polly)
`POST /voice/synthesize`
- **Request Body:** `{ "text": "Explain the difference between a clustered and non-clustered index." }`
- **Response `200 OK`:** Returns `{ contentType: "audio/mpeg", audioBase64: "...", voiceId: "Ruth" }`.

### 11. Start Push-to-Talk Transcription (Amazon Transcribe)
`POST /voice/transcribe`
- **Request Body:** `{ "s3_key": "users/.../audio_answer.webm" }`
- **Response `200 OK`:** Returns `{ job_name: "voice_transcribe_...", status: "IN_PROGRESS" }`.

### 12. Check Transcription Status
`GET /voice/transcriptions/{jobName}`
- **Response `200 OK`:** Returns `{ status: "COMPLETED", transcript: "..." }`.
