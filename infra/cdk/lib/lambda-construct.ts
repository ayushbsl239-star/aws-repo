import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface LambdaConstructProps {
  table: dynamodb.Table;
  documentBucket: s3.Bucket;
  bedrockModelId?: string;
  bedrockGuardrailId?: string;
  bedrockGuardrailVersion?: string;
  agenticMode?: boolean;
}

export class LambdaConstruct extends Construct {
  public readonly handler: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const logGroup = new logs.LogGroup(this, "InterviewApiLogGroup", {
      logGroupName: "/aws/lambda/ai-interview-coach-api",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.handler = new lambda.Function(this, "InterviewApiFunction", {
      functionName: "ai-interview-coach-api",
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "backend.handlers.api_handler.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../../"), {
        exclude: [
          "node_modules",
          "frontend",
          "infra",
          ".git",
          ".pytest_cache",
          "__pycache__",
          "*.pyc",
        ],
      }),
      memorySize: 1024,
      timeout: cdk.Duration.seconds(60),
      logGroup: logGroup,
      environment: {
        DYNAMODB_TABLE: props.table.tableName,
        DOCUMENT_BUCKET: props.documentBucket.bucketName,
        BEDROCK_MODEL_ID: props.bedrockModelId || "anthropic.claude-3-5-sonnet-20241022-v2:0",
        BEDROCK_GUARDRAIL_ID: props.bedrockGuardrailId || "",
        BEDROCK_GUARDRAIL_VERSION: props.bedrockGuardrailVersion || "DRAFT",
        AGENTIC_MODE: props.agenticMode ? "true" : "false",
        LOG_LEVEL: "INFO",
      },
    });

    // 1. DynamoDB permissions
    props.table.grantReadWriteData(this.handler);

    // 2. S3 permissions
    props.documentBucket.grantReadWrite(this.handler);

    // 3. Bedrock least-privilege permissions
    this.handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
          "bedrock:Converse",
          "bedrock:ConverseStream",
          "bedrock:ApplyGuardrail",
        ],
        resources: ["*"], // Bedrock foundation models are regional resources
      })
    );

    // 4. Amazon Polly permissions
    this.handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["polly:SynthesizeSpeech"],
        resources: ["*"],
      })
    );

    // 5. Amazon Transcribe permissions
    this.handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob",
          "transcribe:DeleteTranscriptionJob",
        ],
        resources: ["*"],
      })
    );
  }
}
