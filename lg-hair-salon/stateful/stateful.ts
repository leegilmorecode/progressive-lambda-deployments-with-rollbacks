import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';

export interface LgHairSalonStatefulStackProps extends cdk.StackProps {
  stage: string;
}

export class LgHairSalonStatefulStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(
    scope: Construct,
    id: string,
    props: LgHairSalonStatefulStackProps
  ) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `lg-hair-salon-table-${props.stage}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
