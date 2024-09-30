import { getISOString, logger, schemaValidator } from '@shared';

import { CreateAppointment } from '@dto/appointment';
import { config } from '@config';
import { schema } from '@schemas/appointment';
import { upsert } from '@adapters/secondary/dynamodb-adapter';
import { v4 as uuid } from 'uuid';

const tableName = config.get('tableName');

export async function createAppointmentUseCase(
  newAppointment: CreateAppointment
): Promise<CreateAppointment> {
  const createdDate = getISOString();
  const id = uuid();
  const version = 1;

  const appointment: CreateAppointment = {
    id,
    created: createdDate,
    version,
    ...newAppointment,
  };

  schemaValidator(schema, appointment);

  // throw new Error('we were not expecting this!'); // remove the comment to make the lambda fail

  await upsert(appointment, tableName, id);

  logger.info(`appointment created: ${JSON.stringify(appointment)}`);

  return appointment;
}
