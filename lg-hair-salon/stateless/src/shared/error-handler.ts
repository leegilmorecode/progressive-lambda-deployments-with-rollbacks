import { logger } from '@shared/logger';
import { APIGatewayProxyResult } from 'aws-lambda';

export function errorHandler(error: Error | unknown): APIGatewayProxyResult {
  logger.error(`private error: ${error}`);

  let errorMessage: string;
  let statusCode: number;

  if (error instanceof Error) {
    switch (error.name) {
      case 'ValidationError':
        errorMessage = error.message;
        statusCode = 400;
        logger.error(errorMessage, {
          errorName: error.name,
          statusCode,
        });

        return {
          statusCode,
          body: JSON.stringify({ message: errorMessage }),
        };

      case 'ResourceNotFound':
        errorMessage = error.message;
        statusCode = 404;
        logger.error(errorMessage, {
          errorName: error.name,
          statusCode,
        });

        return {
          statusCode,
          body: JSON.stringify({ message: errorMessage }),
        };

      default:
        errorMessage = 'An unexpected error has occurred';
        statusCode = 500;
        logger.error(errorMessage, {
          errorName: error.name,
          statusCode,
        });

        throw new Error(errorMessage);
    }
  } else {
    errorMessage = 'An unexpected error has occurred';
    statusCode = 500;
    logger.error(errorMessage, { errorName: errorMessage, statusCode });

    throw new Error('Internal Server Error');
  }
}
