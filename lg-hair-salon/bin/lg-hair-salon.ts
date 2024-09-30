#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { LgHairSalonStatefulStack } from '../stateful/stateful';
import { LgHairSalonStatelessStack } from '../stateless/stateless';

// you would get this from a config, but this is just a demo
const stage = 'develop';

const app = new cdk.App();

const statefulStack = new LgHairSalonStatefulStack(
  app,
  'LgHairSalonStatefulStack',
  {
    stage,
  }
);

new LgHairSalonStatelessStack(app, 'LgHairSalonStatelessStack', {
  stage,
  table: statefulStack.table,
  notificationEmail: 'your.email@something.com', // Change this to your email address
});
