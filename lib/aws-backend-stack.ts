import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as iam from "aws-cdk-lib/aws-iam";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import * as logs from 'aws-cdk-lib/aws-logs';

export class AwsBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const audioBucket = new s3.Bucket(this, "AudioBucket", {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const expressLambda = new nodejs.NodejsFunction(this, "ExpressLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../index.js"),
      handler: "handler",
      bundling: {
        externalModules: ["aws-sdk"],
        minify: true,
        sourceMap: true,
        target: 'node18'
      },
      environment: {
        NODE_ENV: "production",
        BUCKET_NAME: audioBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    expressLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "ssm:GetParameter",
          "ssm:PutParameter",
        ],
        resources: [
          audioBucket.arnForObjects("*"),
          `arn:aws:ssm:${this.region}:${this.account}:parameter/*`,
        ],
      })
    );

    const expressApi = new apigateway.LambdaRestApi(this, "ExpressApi", {
      handler: expressLambda,
      proxy: false,
    });

    const presignedUrlResource = expressApi.root.addResource("presigned-url");
    presignedUrlResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(expressLambda)
    );

    expressApi.root.addResource("test").addMethod(
      "GET",
      new apigateway.LambdaIntegration(expressLambda)
    );

    audioBucket.grantReadWrite(expressLambda);

    const audioProcessingLambda = new lambda.Function(
      this,
      "AudioProcessingLambda",
      {
        runtime: lambda.Runtime.PYTHON_3_9,
        code: lambda.Code.fromAsset("lambda"),
        handler: "audio_splitter.handler",
        environment: {
          BUCKET_NAME: audioBucket.bucketName,
        },
      }
    );

    audioBucket.grantReadWrite(audioProcessingLambda);

    const audioApi = new apigateway.RestApi(this, "AudioProcessingApi", {
      restApiName: "Audio Processing Service",
    });

    const audioResource = audioApi.root.addResource("split-audio");
    audioResource.addMethod(
      "POST",
      new apigateway.LambdaIntegration(audioProcessingLambda)
    );

    const userPool = new cognito.UserPool(this, "UserPool", {
      signInAliases: { email: true },
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
    });

    new cdk.CfnOutput(this, "BucketName", { value: audioBucket.bucketName });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new cdk.CfnOutput(this, "AudioApiEndpoint", { value: audioApi.url });
    new cdk.CfnOutput(this, "ExpressApiEndpoint", { value: expressApi.url });
  }
}
