#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InterviewCoachStack } from "../lib/interview-coach-stack";

const app = new cdk.App();

new InterviewCoachStack(app, "AiInterviewCoachStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || "us-east-1",
  },
  description: "AI Adaptive Interview Coach - AWS Innovation Challenge 2026 Production Stack",
});

app.synth();
