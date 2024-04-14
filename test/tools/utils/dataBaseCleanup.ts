import { HttpServer } from '@nestjs/common';

import { RouterPaths } from '../helpers/routing';
import * as request from 'supertest';

export const cleanDatabase = async (httpServer: HttpServer) => {
  await request(httpServer).delete(RouterPaths.test);
};
