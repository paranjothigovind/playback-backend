#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsBackendStack } from '../lib/aws-backend-stack';

const app = new cdk.App();
new AwsBackendStack(app, 'AwsBackendStack', {
  env: { account: '666520252008', region: 'us-east-1' },
});