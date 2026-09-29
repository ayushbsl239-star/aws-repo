# AI Adaptive Interview Coach — Deployment Guide
**AWS Innovation Challenge 2026**

This comprehensive guide walks you through deploying the entire full-stack application to your AWS environment from scratch.

---

## 1. Prerequisites
Ensure you have the following installed on your local workstation:
- **AWS CLI v2:** [Install AWS CLI](https://aws.amazon.com/cli/)
- **Node.js (v20 LTS or higher):** `node -v`
- **Python (v3.11 or v3.12):** `python --version`
- **Git:** `git --version`

---

## 2. AWS CLI Credentials Configuration
Configure your AWS credentials with credentials that have administrator or sufficient deployment permissions:
```bash
aws configure
```
Enter your:
- AWS Access Key ID
- AWS Secret Access Key
- Default region name (e.g. `us-east-1` or `us-west-2`)
- Default output format: `json`

Verify access:
```bash
aws sts get-caller-identity
```

---

## 3. Enable Amazon Bedrock Foundation Models
In the AWS Console:
1. Navigate to **Amazon Bedrock** in `us-east-1` (or your chosen region).
2. Go to **Model access** in the left sidebar.
3. Click **Modify model access** or **Enable specific models**.
4. Enable access for:
   - **Anthropic Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`) or
   - **Amazon Nova Pro** (`amazon.nova-pro-v1:0`).
5. Wait until status shows **Access granted**.

---

## 4. Install Dependencies

### Backend Dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Infrastructure (CDK) Dependencies:
```bash
cd infra/cdk
npm install
cd ../..
```

### Frontend Dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## 5. Deploy Cloud Infrastructure with AWS CDK

### Bootstrap CDK (Only needed once per AWS account/region):
```bash
cd infra/cdk
npx cdk bootstrap
```

### Deploy the Full Serverless Stack:
```bash
npx cdk deploy --require-approval never --outputs-file ../../cdk-outputs.json
```

Once deployment finishes, CDK will output `cdk-outputs.json` containing:
- `InterviewCoachApiEndpoint`: Base URL of your HTTP API Gateway
- `InterviewCoachUserPoolId`: Amazon Cognito User Pool ID
- `InterviewCoachClientId`: Amazon Cognito App Client ID
- `InterviewCoachBucketName`: Private S3 Bucket for documents and voice
- `AwsRegion`: Deployment region

---

## 6. Configure Frontend Environment Variables
In the `frontend/` directory, create or edit `.env.production` (or `.env`):
```bash
cd frontend
cp ../.env.example .env
```
Populate the values from your CDK outputs:
```env
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_DEMO_DEBUG=true
VITE_DEMO_MODE=false
```

---

## 7. Build Frontend Bundle
```bash
cd frontend
npm run build
```
The optimized production bundle will be generated into `frontend/dist/`.

---

## 8. Host & Deploy with AWS Amplify Hosting

### Option A: Via AWS Console (Recommended)
1. Open the [AWS Amplify Console](https://console.aws.amazon.com/amplify).
2. Select **Deploy an app** -> **Deploy without Git provider** (or connect your GitHub repository).
3. Set App Name to `ai-adaptive-interview-coach`.
4. Drag and drop the `frontend/dist` directory into the console.
5. Click **Save and deploy**.

### Option B: Local Preview Server
To immediately test the production build locally:
```bash
cd frontend
npm run preview
```
Visit `http://localhost:4173`.

---

## 9. Run the End-to-End Smoke Test
Verify the deployment end-to-end:
1. Open your web application URL.
2. Click **Start Practising** and create a new account.
3. Check your email for the Cognito 6-digit confirmation code and verify.
4. Log into the Dashboard.
5. Click **Start New Interview**.
6. Select **Data Analyst**, **Fresher**, **Mixed**, **5 Questions**, and Text mode.
7. Click **Start Interview**.
8. Verify Bedrock returns Question #1.
9. Type an answer and submit:
   - Check that DynamoDB records the evaluation.
   - Check that the debug panel shows updated rolling score and next action.
10. Answer all 5 questions to reach completion.
11. Verify the Readiness Score (0-100), Recharts radar chart, and 7-day personalized plan render cleanly.
12. Click **Download PDF Report** to test S3 presigned export.
13. Return to Dashboard to confirm the session appears in your interview history.

---

## 10. Cost Control & Teardown Instructions
To completely tear down all resources and ensure **$0 recurring idle cost**:
```bash
cd infra/cdk
npx cdk destroy --force
```
Empty and delete the S3 document bucket if prompted.
