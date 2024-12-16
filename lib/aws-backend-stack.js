"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsBackendStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const cognito = require("aws-cdk-lib/aws-cognito");
const iam = require("aws-cdk-lib/aws-iam");
const nodejs = require("aws-cdk-lib/aws-lambda-nodejs");
const path = require("path");
const logs = require("aws-cdk-lib/aws-logs");
class AwsBackendStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        expressLambda.addToRolePolicy(new iam.PolicyStatement({
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
        }));
        const expressApi = new apigateway.LambdaRestApi(this, "ExpressApi", {
            handler: expressLambda,
            proxy: false,
        });
        const presignedUrlResource = expressApi.root.addResource("presigned-url");
        presignedUrlResource.addMethod("GET", new apigateway.LambdaIntegration(expressLambda));
        expressApi.root.addResource("test").addMethod("GET", new apigateway.LambdaIntegration(expressLambda));
        audioBucket.grantReadWrite(expressLambda);
        const audioProcessingLambda = new lambda.Function(this, "AudioProcessingLambda", {
            runtime: lambda.Runtime.PYTHON_3_9,
            code: lambda.Code.fromAsset("lambda"),
            handler: "audio_splitter.handler",
            environment: {
                BUCKET_NAME: audioBucket.bucketName,
            },
        });
        audioBucket.grantReadWrite(audioProcessingLambda);
        const audioApi = new apigateway.RestApi(this, "AudioProcessingApi", {
            restApiName: "Audio Processing Service",
        });
        const audioResource = audioApi.root.addResource("split-audio");
        audioResource.addMethod("POST", new apigateway.LambdaIntegration(audioProcessingLambda));
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
exports.AwsBackendStack = AwsBackendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWJhY2tlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhd3MtYmFja2VuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFFbkMseUNBQXlDO0FBQ3pDLGlEQUFpRDtBQUNqRCx5REFBeUQ7QUFDekQsbURBQW1EO0FBQ25ELDJDQUEyQztBQUMzQyx3REFBd0Q7QUFDeEQsNkJBQTZCO0FBQzdCLDZDQUE2QztBQUU3QyxNQUFhLGVBQWdCLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDNUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFzQjtRQUM5RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixNQUFNLFdBQVcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNyRCxTQUFTLEVBQUUsSUFBSTtZQUNmLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU87U0FDekMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxhQUFhLEdBQUcsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDckUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDO1lBQzFDLE9BQU8sRUFBRSxTQUFTO1lBQ2xCLFFBQVEsRUFBRTtnQkFDUixlQUFlLEVBQUUsQ0FBQyxTQUFTLENBQUM7Z0JBQzVCLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFNBQVMsRUFBRSxJQUFJO2dCQUNmLE1BQU0sRUFBRSxRQUFRO2FBQ2pCO1lBQ0QsV0FBVyxFQUFFO2dCQUNYLFFBQVEsRUFBRSxZQUFZO2dCQUN0QixXQUFXLEVBQUUsV0FBVyxDQUFDLFVBQVU7YUFDcEM7WUFDRCxZQUFZLEVBQUUsSUFBSSxD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YyxDQUFDLGdCQUFnQjtTQUN2QyxDQUFDLENBQUM7UUFDSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDM0UsQ0FBQztDQUNGO0FBckdELDBDQXFHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xyXG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcclxuaW1wb3J0ICogYXMgYXBpZ2F0ZXdheSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXlcIjtcclxuaW1wb3J0ICogYXMgY29nbml0byBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNvZ25pdG9cIjtcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCAqIGFzIG5vZGVqcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWxhbWJkYS1ub2RlanNcIjtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcclxuXHJcbmV4cG9ydCBjbGFzcyBBd3NCYWNrZW5kU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xyXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcclxuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xyXG5cclxuICAgIGNvbnN0IGF1ZGlvQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIkF1ZGlvQnVja2V0XCIsIHtcclxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxyXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgZXhwcmVzc0xhbWJkYSA9IG5ldyBub2RlanMuTm9kZWpzRnVuY3Rpb24odGhpcywgXCJFeHByZXNzTGFtYmRhXCIsIHtcclxuICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuTk9ERUpTXzE4X1gsXHJcbiAgICAgIGVudHJ5OiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uL2luZGV4LmpzXCIpLFxyXG4gICAgICBoYW5kbGVyOiBcImhhbmRsZXJcIixcclxuICAgICAgYnVuZGxpbmc6IHtcclxuICAgICAgICBleHRlcm5hbE1vZHVsZXM6IFtcImF3cy1zZGtcIl0sXHJcbiAgICAgICAgbWluaWZ5OiB0cnVlLFxyXG4gICAgICAgIHNvdXJjZU1hcDogdHJ1ZSxcclxuICAgICAgICB0YXJnZXQ6ICdub2RlMTgnXHJcbiAgICAgIH0sXHJcbiAgICAgIGVudmlyb25tZW50OiB7XHJcbiAgICAgICAgTk9ERV9FTlY6IFwicHJvZHVjdGlvblwiLFxyXG4gICAgICAgIEJVQ0tFVF9OQU1FOiBhdWRpb0J1Y2tldC5idWNrZXROYW1lLFxyXG4gICAgICB9LFxyXG4gICAgICBsb2dSZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcclxuICAgIH0pO1xyXG5cclxuICAgIGV4cHJlc3NMYW1iZGEuYWRkVG9Sb2xlUG9saWN5KFxyXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCIsXHJcbiAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxyXG4gICAgICAgICAgXCJzc206R2V0UGFyYW1ldGVyXCIsXHJcbiAgICAgICAgICBcInNzbTpQdXRQYXJhbWV0ZXJcIixcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlc291cmNlczogW1xyXG4gICAgICAgICAgYXVkaW9CdWNrZXQuYXJuRm9yT2JqZWN0cyhcIipcIiksXHJcbiAgICAgICAgICBgYXJuOmF3czpzc206JHt0aGlzLnJlZ2lvbn06JHt0aGlzLmFjY291bnR9OnBhcmFtZXRlci8qYCxcclxuICAgICAgICBdLFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBleHByZXNzQXBpID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhUmVzdEFwaSh0aGlzLCBcIkV4cHJlc3NBcGlcIiwge1xyXG4gICAgICBoYW5kbGVyOiBleHByZXNzTGFtYmRhLFxyXG4gICAgICBwcm94eTogZmFsc2UsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBwcmVzaWduZWRVcmxSZXNvdXJjZSA9IGV4cHJlc3NBcGkucm9vdC5hZGRSZXNvdXJjZShcInByZXNpZ25lZC11cmxcIik7XHJcbiAgICBwcmVzaWduZWRVcmxSZXNvdXJjZS5hZGRNZXRob2QoXHJcbiAgICAgIFwiR0VUXCIsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGV4cHJlc3NMYW1iZGEpXHJcbiAgICApO1xyXG5cclxuICAgIGV4cHJlc3NBcGkucm9vdC5hZGRSZXNvdXJjZShcInRlc3RcIikuYWRkTWV0aG9kKFxyXG4gICAgICBcIkdFVFwiLFxyXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbihleHByZXNzTGFtYmRhKVxyXG4gICAgKTtcclxuXHJcbiAgICBhdWRpb0J1Y2tldC5ncmFudFJlYWRXcml0ZShleHByZXNzTGFtYmRhKTtcclxuXHJcbiAgICBjb25zdCBhdWRpb1Byb2Nlc3NpbmdMYW1iZGEgPSBuZXcgbGFtYmRhLkZ1bmN0aW9uKFxyXG4gICAgICB0aGlzLFxyXG4gICAgICBcIkF1ZGlvUHJvY2Vzc2luZ0xhbWJkYVwiLFxyXG4gICAgICB7XHJcbiAgICAgICAgcnVudGltZTogbGFtYmRhLlJ1bnRpbWUuUFlUSE9OXzNfOSxcclxuICAgICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tQXNzZXQoXCJsYW1iZGFcIiksXHJcbiAgICAgICAgaGFuZGxlcjogXCJhdWRpb19zcGxpdHRlci5oYW5kbGVyXCIsXHJcbiAgICAgICAgZW52aXJvbm1lbnQ6IHtcclxuICAgICAgICAgIEJVQ0tFVF9OQU1FOiBhdWRpb0J1Y2tldC5idWNrZXROYW1lLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgYXVkaW9CdWNrZXQuZ3JhbnRSZWFkV3JpdGUoYXVkaW9Qcm9jZXNzaW5nTGFtYmRhKTtcclxuXHJcbiAgICBjb25zdCBhdWRpb0FwaSA9IG5ldyBhcGlnYXRld2F5LlJlc3RBcGkodGhpcywgXCJBdWRpb1Byb2Nlc3NpbmdBcGlcIiwge1xyXG4gICAgICByZXN0QXBpTmFtZTogXCJBdWRpbyBQcm9jZXNzaW5nIFNlcnZpY2VcIixcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGF1ZGlvUmVzb3VyY2UgPSBhdWRpb0FwaS5yb290LmFkZFJlc291cmNlKFwic3BsaXQtYXVkaW9cIik7XHJcbiAgICBhdWRpb1Jlc291cmNlLmFkZE1ldGhvZChcclxuICAgICAgXCJQT1NUXCIsXHJcbiAgICAgIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKGF1ZGlvUHJvY2Vzc2luZ0xhbWJkYSlcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgdXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCBcIlVzZXJQb29sXCIsIHtcclxuICAgICAgc2lnbkluQWxpYXNlczogeyBlbWFpbDogdHJ1ZSB9LFxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdXNlclBvb2xDbGllbnQgPSBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCBcIlVzZXJQb29sQ2xpZW50XCIsIHtcclxuICAgICAgdXNlclBvb2wsXHJcbiAgICB9KTtcclxuXHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkJ1Y2tldE5hbWVcIiwgeyB2YWx1ZTogYXVkaW9CdWNrZXQuYnVja2V0TmFtZSB9KTtcclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiVXNlclBvb2xJZFwiLCB7IHZhbHVlOiB1c2VyUG9vbC51c2VyUG9vbElkIH0pO1xyXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJVc2VyUG9vbENsaWVudElkXCIsIHtcclxuICAgICAgdmFsdWU6IHVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXHJcbiAgICB9KTtcclxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsIFwiQXVkaW9BcGlFbmRwb2ludFwiLCB7IHZhbHVlOiBhdWRpb0FwaS51cmwgfSk7XHJcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkV4cHJlc3NBcGlFbmRwb2ludFwiLCB7IHZhbHVlOiBleHByZXNzQXBpLnVybCB9KTtcclxuICB9XHJcbn1cclxuIl19