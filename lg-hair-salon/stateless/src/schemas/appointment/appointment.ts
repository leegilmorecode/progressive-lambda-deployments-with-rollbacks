export const schema = {
  type: 'object',
  required: [
    'id',
    'created',
    'clientName',
    'appointmentDate',
    'serviceType',
    'version',
  ],
  maxProperties: 13,
  minProperties: 5,
  properties: {
    id: { type: 'string' },
    created: { type: 'string' },
    clientName: { type: 'string' },
    appointmentDate: { type: 'string', format: 'date-time' },
    serviceType: {
      type: 'string',
      enum: ['haircut', 'coloring', 'styling', 'treatment'],
    },
    stylist: { type: 'string' },
    notes: { type: 'string' },
    duration: { type: 'integer', minimum: 15 },
    version: { type: 'number' },
  },
};
