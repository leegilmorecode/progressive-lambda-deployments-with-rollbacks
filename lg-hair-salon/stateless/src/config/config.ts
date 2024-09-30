import convict = require('convict');

export const config = convict({
  tableName: {
    doc: 'The dynamodb table',
    default: '',
    env: 'TABLE_NAME',
    nullable: false,
  },
});
