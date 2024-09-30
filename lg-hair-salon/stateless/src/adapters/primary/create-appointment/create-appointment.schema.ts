export const schema = {
  type: 'object',
  required: ['clientName', 'appointmentDate', 'serviceType'],
  maxProperties: 10,
  minProperties: 3,
  properties: {
    clientName: { type: 'string' },
    appointmentDate: { type: 'string', format: 'date-time' },
    serviceType: {
      type: 'string',
      enum: ['haircut', 'coloring', 'styling', 'treatment'],
    },
    stylist: { type: 'string' },
    notes: { type: 'string' },
    duration: { type: 'integer', minimum: 15 },
  },
};
