import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as codeDeploy from 'aws-cdk-lib/aws-codedeploy';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

import { Construct } from 'constructs';
import { ProgressiveLambda } from '../app-constructs';
import { createAppointmentMetricValues } from './src/types';

export interface LgHairSalonStatelessStackProps extends cdk.StackProps {
  stage: string;
  table: dynamodb.Table;
  notificationEmail: string;
}

export class LgHairSalonStatelessStack extends cdk.Stack {
  private table: dynamodb.Table;
  private readonly api: apigw.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: LgHairSalonStatelessStackProps
  ) {
    super(scope, id, props);

    const { table, stage, notificationEmail } = props;

    this.table = table;

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
      POWERTOOLS_SERVICE_NAME: 'lg-hair-salon',
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_METRICS_NAMESPACE: 'lg-hair-salon.com',
    };

    // create a code deploy application for the solution (per stage)
    const application = new codeDeploy.LambdaApplication(
      this,
      'CodeDeployApplication',
      {
        applicationName: stage,
      }
    );

    // create an sns topic so we can be alerted if functions fail deployment
    const lambdaDeploymentTopic: sns.Topic = new sns.Topic(
      this,
      'LambdaDeploymentTopic',
      {
        displayName: `${stage} Lambda Deployment Topic`,
        topicName: `${stage}LambdaDeploymentTopic`,
      }
    );
    lambdaDeploymentTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // send an email when the lambda progressive deployment topic is in error state
    const lambdaDeploymentSubscriptions = lambdaDeploymentTopic.addSubscription(
      new subscriptions.EmailSubscription(notificationEmail)
    );
    lambdaDeploymentSubscriptions.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const {
      alias: createAppointmentLambdaAlias,
      lambda: createAppointmentLambda,
    } = new ProgressiveLambda(this, 'CreateAppointmentLambda', {
      stageName: stage,
      functionName: `create-appointment-lambda-${stage}`,
      serviceName: lambdaPowerToolsConfig.POWERTOOLS_SERVICE_NAME,
      metricName: createAppointmentMetricValues.createAppointmentError,
      namespace: lambdaPowerToolsConfig.POWERTOOLS_METRICS_NAMESPACE,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_DAY,
      architecture: lambda.Architecture.ARM_64,
      application,
      alarmEnabed: true,
      snsTopic: lambdaDeploymentTopic,
      timeout: cdk.Duration.seconds(5),
      retryAttempts: 0,
      deploymentConfig:
        codeDeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(
        __dirname,
        './src/adapters/primary/create-appointment/create-appointment.adapter.ts'
      ),
      memorySize: 1024,
      handler: 'handler',
      bundling: {
        minify: true,
        externalModules: [],
        sourceMap: false,
      },
      environment: {
        TABLE_NAME: table.tableName,
        ...lambdaPowerToolsConfig,
      },
    });

    // allow the lambda function to write to the table
    this.table.grantWriteData(createAppointmentLambda);

    // create our rest api
    const api: apigw.RestApi = new apigw.RestApi(this, 'Api', {
      description: `(${stage}) hair salon api`,
      deploy: true,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    const root: apigw.Resource = api.root.addResource('v1');
    const appointments: apigw.Resource = root.addResource('appointments');

    // point the api resource to the alias
    appointments.addMethod(
      'POST',
      new apigw.LambdaIntegration(createAppointmentLambdaAlias, {
        proxy: true,
      })
    );
  }
}
