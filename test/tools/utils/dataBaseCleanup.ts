import { HttpServer } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { RouterPaths } from '../../../src/infra/utils/routing';

export const cleanDatabase = async (httpServer: HttpServer) => {
  await request(httpServer).delete(RouterPaths.test);
};

export const clearDB = async (dataSource: DataSource) => {
  const entities = dataSource.entityMetadatas;
  try {
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE ${entity.tableName} RESTART IDENTITY CASCADE;`,
      );
    }
  } catch (error) {
    throw new Error(`ERROR: Cleaning test db: ${error}`);
  }
};
