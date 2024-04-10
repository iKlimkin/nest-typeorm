import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { RouterPaths } from '../helpers/routing';

export const cleanDatabase = async (app: INestApplication) => {
  await request(app.getHttpServer()).delete(`${RouterPaths.test}`);
};
