#!/bin/bash
set -e

echo "=========================================================="
echo "AI Adaptive Interview Coach - AWS CDK Deployment"
echo "=========================================================="

cd "$(dirname "$0")/../cdk"

# 1. Install CDK dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing CDK dependencies..."
    npm install
fi

# 2. Build TypeScript
npm run build

# 3. Bootstrap CDK if needed
echo "Bootstrapping AWS CDK environment..."
npx cdk bootstrap || true

# 4. Deploy Stack
echo "Deploying AiInterviewCoachStack..."
npx cdk deploy --require-approval never --outputs-file ../../cdk-outputs.json

echo "=========================================================="
echo "Deployment Complete! Stack outputs saved to cdk-outputs.json"
echo "=========================================================="
