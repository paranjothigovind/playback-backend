#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const aws_backend_stack_1 = require("../lib/aws-backend-stack");
const app = new cdk.App();
new aws_backend_stack_1.AwsBackendStack(app, 'AwsBackendStack', {
    env: { account: '666520252008', region: 'us-east-1' },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXdzLWJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhd3MtYmFja2VuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxtQ0FBbUM7QUFDbkMsZ0VBQTJEO0FBRTNELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLElBQUksbUNBQWUsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLEVBQUU7SUFDMUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFO0NBQ3RELENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBBd3NCYWNrZW5kU3RhY2sgfSBmcm9tICcuLi9saWIvYXdzLWJhY2tlbmQtc3RhY2snO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xubmV3IEF3c0JhY2tlbmRTdGFjayhhcHAsICdBd3NCYWNrZW5kU3RhY2snLCB7XG4gIGVudjogeyBhY2NvdW50OiAnNjY2NTIwMjUyMDA4JywgcmVnaW9uOiAndXMtZWFzdC0xJyB9LFxufSk7Il19