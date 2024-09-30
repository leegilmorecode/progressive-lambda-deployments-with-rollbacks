import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as codeDeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';

import { Duration, RemovalPolicy } from 'aws-cdk-lib';

import { Construct } from 'constructs';

interface ProgressiveLambdaProps extends nodeLambda.NodejsFunctionProps {
  /**
   * The stage name which the lambda is being used with
   */
  stageName: string;
  /**
   * The CodeDeploy application which this lambda is part of
   */
  application: codeDeploy.LambdaApplication;
  /**
   * The CodeDeploy lambda deployment config
   */
  deploymentConfig: codeDeploy.ILambdaDeploymentConfig;
  /**
   * Whether or not the alarm is enabled
   */
  alarmEnabed: boolean;
  /**
   * A reference to the SNS topic which the alarm will use
   */
  snsTopic: sns.Topic;
}

export class ProgressiveLambda extends Construct {
  public readonly lambda: nodeLambda.NodejsFunction;
  public readonly alias: lambda.Alias;
  public readonly alarm: cloudwatch.Alarm;
  public readonly deploymentGroup: codeDeploy.LambdaDeploymentGroup;

  private readonly application: codeDeploy.LambdaApplication;
  private readonly deploymentConfig: codeDeploy.ILambdaDeploymentConfig;

  constructor(scope: Construct, id: string, props: ProgressiveLambdaProps) {
    super(scope, id);

    this.application = props.application;
    this.deploymentConfig = props.deploymentConfig;

    // create the Lambda function
    this.lambda = new nodeLambda.NodejsFunction(this, id, {
      ...props,
    });

    // create an alias for the Lambda version
    this.alias = new lambda.Alias(this, id + 'Alias', {
      aliasName: props.stageName,
      version: this.lambda.currentVersion,
    });

    // create a CloudWatch alarm for deployment errors
    this.alarm = new cloudwatch.Alarm(this, id + 'Failure', {
      alarmDescription: `Deployment error alarm for ${id} (alias: ${this.alias.aliasName})`,
      actionsEnabled: props.alarmEnabed,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      metric: this.alias.metricErrors({
        statistic: 'sum',
        period: Duration.minutes(1),
      }),
      threshold: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
    });

    // send alarm notifications to the SNS topic
    this.alarm.addAlarmAction(new actions.SnsAction(props.snsTopic));
    this.alarm.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // create the CodeDeploy deployment group
    this.deploymentGroup = new codeDeploy.LambdaDeploymentGroup(
      this,
      id + 'CanaryDeployment',
      {
        alias: this.alias,
        deploymentConfig: this.deploymentConfig,
        alarms: [this.alarm],
        application: this.application,
      }
    );
  }
}
