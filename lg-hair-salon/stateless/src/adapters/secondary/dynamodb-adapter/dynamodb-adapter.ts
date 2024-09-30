import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { ResourceNotFoundError } from '@errors/resource-not-found';
import { logger } from '@shared';

const dynamoDb = new DynamoDBClient({});

// Example usage:
// const user: User = await getById<User>(userId, "users");
export async function getById<T>(id: string, tableName: string): Promise<T> {
  const params = {
    TableName: tableName,
    Key: {
      id: { S: id },
    },
  };

  try {
    const data = await dynamoDb.send(new GetItemCommand(params));

    if (!data.Item) {
      throw new ResourceNotFoundError(`item with ID ${id} not found`);
    }

    const item = unmarshall(data.Item) as T;

    logger.info(`item with ID ${id} retrieved successfully`);

    return item;
  } catch (error) {
    console.error('error retrieving item:', error);
    throw error;
  }
}

// Example usage:
// const upsertedUser: User = await upsert<User>(newUser, "users", "user123");
export async function upsert<T>(
  newItem: T,
  tableName: string,
  id: string
): Promise<T> {
  const params = {
    TableName: tableName,
    Item: marshall(newItem),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.info(`item created with ID ${id} into ${tableName}`);

    return newItem;
  } catch (error) {
    console.error('error creating item:', error);
    throw error;
  }
}
