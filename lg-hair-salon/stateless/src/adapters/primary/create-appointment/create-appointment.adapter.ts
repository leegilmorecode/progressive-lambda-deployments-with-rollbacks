import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { errorHandler, logger, schemaValidator } from '@shared';

import { CreateAppointment } from '@dto/appointment';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { ValidationError } from '@errors/validation-error';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { createAppointmentMetricValues } from 'stateless/src/types';
import { createAppointmentUseCase } from '@use-cases/create-appointment';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';
import { schema } from './create-appointment.schema';

const tracer = new Tracer();
const metrics = new Metrics();

export const createAppointmentAdapter = async ({
  body,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) throw new ValidationError('no payload body');

    const appointment = JSON.parse(body) as CreateAppointment;

    schemaValidator(schema, appointment);

    const created: CreateAppointment = await createAppointmentUseCase(
      appointment
    );

    metrics.addMetric(
      createAppointmentMetricValues.successfulCreateAppointment,
      MetricUnit.Count,
      1
    );

    return {
      statusCode: 201,
      body: JSON.stringify(created),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric(
      createAppointmentMetricValues.createAppointmentError,
      MetricUnit.Count,
      1
    );

    return errorHandler(error);
  }
};

export const handler = middy(createAppointmentAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
