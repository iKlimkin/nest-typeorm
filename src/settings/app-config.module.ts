import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';
import configuration from '../config/configuration';
import { getMongoConnection, getEnv } from '../config/env-configurations';

export const configModule = ConfigModule.forRoot({
  // envFilePath: ['.env.local', '.env'] prioritize
  isGlobal: true,
  load: [configuration, getMongoConnection, getEnv],
  // cache: true,
  // validationSchema: Joi.object({
  //   PORT: Joi.number().valid(5000),
  //   MONGO_URL: Joi.string().uri(),
  //   DB_LOCAL: Joi.string().required(),
  // }),
  // expandVariables: true,
});
