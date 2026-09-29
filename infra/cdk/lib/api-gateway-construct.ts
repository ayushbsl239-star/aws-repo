import * as cdk from "aws-cdk-lib";
import * as apigw2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigw2_authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as apigw2_integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface ApiGatewayConstructProps {
  handler: lambda.Function;
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
}

export class ApiGatewayConstruct extends Construct {
  public readonly httpApi: apigw2.HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    // Cognito JWT Authorizer
    const authorizer = new apigw2_authorizers.HttpUserPoolAuthorizer(
      "CognitoAuthorizer",
      props.userPool,
      {
        userPoolClients: [props.userPoolClient],
        identitySource: ["$request.header.Authorization"],
      }
    );

    // Lambda proxy integration
    const lambdaIntegration = new apigw2_integrations.HttpLambdaIntegration(
      "ApiLambdaIntegration",
      props.handler
    );

    // HTTP API with modern CORS settings
    this.httpApi = new apigw2.HttpApi(this, "InterviewCoachHttpApi", {
      apiName: "ai-interview-coach-api",
      corsPreflight: {
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
          "X-Amz-Security-Token",
          "x-mock-user-sub",
        ],
        allowMethods: [
          apigw2.CorsHttpMethod.GET,
          apigw2.CorsHttpMethod.POST,
          apigw2.CorsHttpMethod.PUT,
          apigw2.CorsHttpMethod.DELETE,
          apigw2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
        allowCredentials: false,
        maxAge: cdk.Duration.days(1),
      },
    });

    // Public health check route
    this.httpApi.addRoutes({
      path: "/health",
      methods: [apigw2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // Protected default/proxy route
    this.httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [
        apigw2.HttpMethod.GET,
        apigw2.HttpMethod.POST,
        apigw2.HttpMethod.PUT,
        apigw2.HttpMethod.DELETE,
      ],
      integration: lambdaIntegration,
      authorizer: authorizer,
    });
  }
}
