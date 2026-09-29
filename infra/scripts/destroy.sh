#!/bin/bash
set -e

echo "=========================================================="
echo "AI Adaptive Interview Coach - Teardown / Cleanup"
echo "=========================================================="

read -p "Are you sure you want to destroy all AWS resources created for this project? (y/N): " confirm
if [[ "$confirm" =~ ^[Yy]$ ]]; then
    cd "$(dirname "$0")/../cdk"
    echo "Destroying AiInterviewCoachStack..."
    npx cdk destroy --force
    echo "Stack successfully torn down. $0 idle AWS cost achieved."
else
    echo "Teardown cancelled."
fi
