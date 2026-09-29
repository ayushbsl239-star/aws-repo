# AI Adaptive Interview Coach
### AWS Innovation Challenge 2026 Submission

[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/)
[![Amazon Bedrock](https://img.shields.io/badge/Amazon-Bedrock_Converse_API-blue.svg)](https://aws.amazon.com/bedrock/)
[![DynamoDB](https://img.shields.io/badge/Database-DynamoDB_Single_Table-4053D6.svg)](https://aws.amazon.com/dynamodb/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **"Every candidate answer changes the future interview."**  
> An intelligent, generative interview preparation platform engineered with **Amazon Bedrock Converse API**, **Bedrock AgentCore**, **Amazon Polly**, **Amazon Transcribe**, and **Amazon DynamoDB**.

---

## Table of Contents
1. [Product Overview](#product-overview)
2. [Key Differentiators & The Adaptive Loop](#key-differentiators)
3. [AWS Services & Architecture](#aws-services--architecture)
4. [Agentic AI vs Deterministic Engine](#agentic-ai-vs-deterministic-engine)
5. [Repository Structure](#repository-structure)
6. [Quickstart: Local Development](#quickstart-local-development)
7. [Running Tests & Evaluation Benchmarks](#running-tests--evaluation-benchmarks)
8. [AWS Cloud Deployment](#aws-cloud-deployment)
9. [Hackathon Demo Walkthrough](#hackathon-demo-walkthrough)
10. [Security & Fairness Guardrails](#security--fairness-guardrails)
11. [Cost Awareness & Cleanup](#cost-awareness--cleanup)

---

## 1. Product Overview
Traditional interview preparation platforms suffer from one glaring flaw: **they are static**. They present a pre-scripted series of questions regardless of whether the candidate gave a genius answer or completely missed the point.

The **AI Adaptive Interview Coach** behaves like an experienced hiring manager:
- Evaluates candidate answers against objective, 5-dimensional weighted rubrics.
- Continuously maintains a mathematical rolling candidate skill profile.
- Dynamically shifts difficulty up (1 to 5) when mastery is verified, or down to test foundational principles when gaps emerge.
- Employs **Bedrock AgentCore** to ask targeted follow-up questions when candidate assertions warrant deeper technical justification.
- Synthesizes an **Interview Readiness Score (0 to 100)** and a personalized **7-Day Improvement Plan** with downloadable PDF reports.

---

## 2. Key Differentiators & The Adaptive Loop

```
ASK ──► ANSWER ──► ANALYSE ──► SCORE ──► UPDATE SKILL PROFILE ──► DECIDE ACTION ──► GENERATE NEXT QUESTION
 ▲                                                                                         │
 └─────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Deterministic & Agentic Hybrid:** AgentCore tools propose pedagogical actions, while a Python Safety Boundary enforces hard invariant constraints.
2. **Server-Side Rubrics:** Overall scores are computed server-side via weighted mathematical formulas (Technical Accuracy 30%, Relevance 20%, Completeness 20%, Communication 15%, Problem-solving 15%) rather than trusting arbitrary LLM numbers.
3. **No Hallucinated Hirability Speculation:** Performance is framed strictly as an **Interview Readiness Score**, explicitly stating that it reflects rubric performance rather than hiring probability.
4. **Push-to-Talk Speech & Neural TTS:** Push-to-talk audio recorded in-browser is transcribed via **Amazon Transcribe** with candidate correction preview, and questions are spoken naturally via **Amazon Polly Neural**.

---

## 3. AWS Services & Architecture
Detailed cloud diagrams and explanations are documented in [ARCHITECTURE.md](file:///c:/Users/ayush/Desktop/project/ARCHITECTURE.md).

- **Amazon Bedrock Runtime (Converse API):** Generates questions, evaluates answers, and synthesizes 7-day plans without hardcoded model IDs.
- **Amazon Bedrock AgentCore:** Autonomous orchestration choosing whether to ask follow-ups, switch competencies, or escalate difficulty.
- **Amazon DynamoDB:** High-performance single-table design with on-demand billing ($0 idle cost).
- **Amazon Cognito:** User Pools with email verification, secure SRP authentication, and JWT authorization for API Gateway.
- **Amazon API Gateway (HTTP API v2):** Secure REST endpoints with Cognito authorizer and CORS preflight.
- **Amazon S3:** Private bucket for resumes, job descriptions, voice audio, and PDF reports with short-lived presigned URLs.
- **Amazon Transcribe:** Speech-to-text pipeline for voice interviews.
- **Amazon Polly:** Neural TTS for spoken question synthesis.
- **Amazon CloudWatch:** Structured JSON telemetry capturing latency, Bedrock response times, and sanitizing all PII/secrets.
- **AWS Amplify:** Global edge deployment for the modern React frontend.

---

## 4. Agentic AI vs Deterministic Engine
The platform provides a dual-layer decision engine controlled by `AGENTIC_MODE=true/false`:
- **When `AGENTIC_MODE=true`:** Bedrock Converse invokes tool calling (`get_interview_state`, `get_candidate_skill_profile`, `propose_next_action`).
- **Safety Boundary Enforcement:** The Python backend inspects the proposed action against user ownership, question budget limits, and difficulty jump limits (max 1 step).
- **Graceful Fallback:** If Agentic mode is disabled or an invalid action is proposed, the system automatically falls back to the deterministic Python adaptive engine without disruption.

---

## 5. Repository Structure
```
ai-adaptive-interview-coach/
├── .env.example                # Unified configuration template
├── package.json                # Monorepo task orchestration
├── README.md                   # Project overview & quickstart
├── ARCHITECTURE.md             # Cloud topology & data flow
├── API.md                      # REST endpoint specifications
├── PROMPTS.md                  # Bedrock system prompts & guardrails
├── DEPLOYMENT.md               # Step-by-step AWS CDK deployment guide
├── backend/                    # Python 3.12 Serverless Backend
│   ├── handlers/               # API Gateway & Auth middleware
│   ├── services/
│   │   ├── bedrock/            # Converse API client, prompts, Pydantic validator
│   │   ├── adaptive/           # Deterministic engine, skill profile, rubrics
│   │   ├── agent/              # Bedrock AgentCore orchestrator & safety boundary
│   │   ├── documents/          # PDF, DOCX, TXT parser & analyzers
│   │   ├── voice/              # Amazon Transcribe & Polly services
│   │   ├── reports/            # Readiness score (0-100), PDF generator
│   │   └── storage/            # DynamoDB single-table & S3 presigned clients
│   ├── models/                 # Domain, evaluation, and DTO Pydantic models
│   ├── utils/                  # Structured CloudWatch logger & error formatters
│   ├── tests/                  # 16 unit tests for adaptive engine & security
│   └── tests/evaluation/       # Benchmark accuracy harness & labeled dataset
├── infra/                      # AWS CDK (TypeScript)
│   ├── cdk/                    # CDK Stack, constructs (Cognito, DynamoDB, S3, Lambda, API GW)
│   └── scripts/                # Automated deploy.sh and destroy.sh scripts
└── frontend/                   # Modern React 18 SPA (Vite + TS + Tailwind + Recharts)
    ├── src/
    │   ├── components/         # Navbar, Footer, HackathonDebugPanel, ProtectedRoute
    │   ├── pages/              # Landing, Login, Signup, Dashboard, Wizard, Interview, Report, History, Architecture
    │   ├── services/           # AWS Amplify auth, API client, voice recorder, demoData
    │   └── hooks/              # useAuth, useVoiceRecorder
```

---

## 6. Quickstart: Local Development

### 1. Clone & Configure Environment:
```bash
git clone <repo-url>
cd ai-adaptive-interview-coach
cp .env.example .env
```

### 2. Run Backend Tests:
```bash
python -m pytest backend/tests
```

### 3. Run AI Evaluation Benchmark:
```bash
python backend/tests/evaluation/benchmark.py
```

### 4. Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Offline Demo Mode:** If live AWS credentials are not yet configured, the frontend automatically defaults to its built-in **DEMO_MODE**, allowing judges to evaluate the full end-to-end interactive experience locally without errors.

---

## 7. Running Tests & Evaluation Benchmarks
We test all core logic comprehensively:

```bash
# 1. Run all 16 backend unit tests
python -m pytest backend/tests

# 2. Benchmark Bedrock evaluation accuracy against human ground-truth rubrics
python backend/tests/evaluation/benchmark.py
```

---

## 8. AWS Cloud Deployment
Deploying to AWS takes under 5 minutes using the automated CDK scripts:

```bash
# Deploy entire AWS cloud stack (Cognito, DynamoDB, S3, Lambda, API Gateway)
cd infra/cdk
npm install
npm run build
npx cdk deploy --require-approval never
```
Review the step-by-step walkthrough in [DEPLOYMENT.md](file:///c:/Users/ayush/Desktop/project/DEPLOYMENT.md).

---

## 9. Hackathon Demo Walkthrough (Requirement 73)
To replicate the exact judging evaluation flow:
1. Open the website and click **Log In** (use the one-click demo credentials shortcut).
2. Click **Start New Interview**.
3. Select **Data Analyst**, **Fresher**, **Mixed Interview**, **5 Questions**.
4. Paste the sample Data Analyst JD (provided in wizard).
5. Click **Start Interview**.
6. **Question 1 (SQL Joins):** Answer strongly.  
   *Observation:* Expanding the **Adaptive Engine Telemetry** panel shows score $> 8.0$ and difficulty escalation from 2 to 3.
7. **Question 2 (SQL Query Optimization):** Answer satisfactorily.  
   *Observation:* System maintains difficulty or probes missing index types via follow-up.
8. **Question 3 (Statistics):** Give a weak answer regarding p-values.  
   *Observation:* System immediately flags statistical gap, adjusts difficulty to 2, and switches target competency to diagnose fundamentals.
9. **Question 5 (Completion):**  
   *Observation:* Interview completes with confetti, displaying **Interview Readiness: 82/100**, Recharts radar profile, example improved answers, and a 7-day personalized study schedule.

---

## 10. Security & Fairness Guardrails
- **No AWS Secrets in Frontend:** All client operations use presigned URLs or Cognito JWT tokens.
- **Least-Privilege IAM:** The Lambda execution role has discrete permissions restricted to Bedrock Converse, Polly, Transcribe, DynamoDB, and the S3 bucket.
- **Bedrock Guardrails:** Zero evaluation of protected demographic attributes (race, gender, accent, appearance). Evaluates only answer content against objective rubrics.
- **Structured CloudWatch Sanitization:** Passwords, JWTs, and sensitive resumes are automatically redacted before logging.

---

## 11. Cost Awareness & Cleanup
Engineered entirely on serverless primitives with **$0 idle cost**:
- DynamoDB `PAY_PER_REQUEST` billing
- AWS Lambda per-millisecond execution
- S3 auto-deletion lifecycle rule for audio recordings after 7 days
- Teardown command: `npx cdk destroy --force`
