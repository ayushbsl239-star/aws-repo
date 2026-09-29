import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiGatewayConstruct } from "./api-gateway-construct";
import { CognitoConstruct } from "./cognito-construct";
import { DynamoDbConstruct } from "./dynamodb-construct";
import { LambdaConstruct } from "./lambda-construct";
import { StorageConstruct } from "./storage-construct";

export class InterviewCoachStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Authentication (Cognito)
    const cognitoConstruct = new CognitoConstruct(this, "Cognito");

    // 2. Database (DynamoDB Single-Table)
    const dynamoDbConstruct = new DynamoDbConstruct(this, "DynamoDb");

    // 3. Storage (S3 Document Bucket)
    const storageConstruct = new StorageConstruct(this, "Storage");

    // 4. Backend Compute (Python Lambda)
    const lambdaConstruct = new LambdaConstruct(this, "Compute", {
      table: dynamoDbConstruct.table,
      documentBucket: storageConstruct.documentBucket,
      bedrockModelId: this.node.tryGetContext("bedrockModelId"),
      bedrockGuardrailId: this.node.tryGetContext("bedrockGuardrailId"),
      bedrockGuardrailVersion: this.node.tryGetContext("bedrockGuardrailVersion"),
      agenticMode: this.node.tryGetContext("agenticMode") === "true",
    });

    // 5. API Gateway
    const apiGatewayConstruct = new ApiGatewayConstruct(this, "ApiGateway", {
      handler: lambdaConstruct.handler,
      userPool: cognitoConstruct.userPool,
      userPoolClient: cognitoConstruct.userPoolClient,
    });

    // CloudFormation Outputs for Frontend and CI/CD
    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: apiGatewayConstruct.httpApi.apiEndpoint,
      description: "Base URL for the AI Interview Coach API Gateway",
      exportName: "InterviewCoachApiEndpoint",
    });

    new cdk.CfnOutput(this, "CognitoUserPoolId", {
      value: cognitoConstruct.userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: "InterviewCoachUserPoolId",
    });

    new cdk.CfnOutput(this, "CognitoClientId", {
      value: cognitoConstruct.userPoolClient.userPoolClientId,
      description: "Cognito Web Client ID",
      exportName: "InterviewCoachClientId",
    });

    new cdk.CfnOutput(this, "DocumentBucketName", {
      value: storageConstruct.documentBucket.bucketName,
      description: "Private S3 bucket name for documents and voice",
      exportName: "InterviewCoachBucketName",
    });

    new cdk.CfnOutput(this, "AwsRegion", {
      value: this.region,
      description: "AWS Deployment Region",
    });
  }
}
