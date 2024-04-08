import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
// import Joi from 'joi'

export const configModule = ConfigModule.forRoot({
  // envFilePath: ['.env.local', '.env'] prioritize
  isGlobal: true,
  load: [configuration],
  // cache: true,
  // validationSchema: Joi.object({
  //   PORT: Joi.number().valid(5000),
  //   MONGO_URL: Joi.string().uri(),
  //   DB_LOCAL: Joi.string().required(),
  // }),
  // expandVariables: true,
});
