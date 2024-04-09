import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import configuration from './config/configuration';

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  load: [configuration],
  validationSchema: Joi.object({
    PORT: Joi.number().port().default(5000),
    ACCESS_TOKEN_SECRET: Joi.string().required(),
    REFRESH_TOKEN_SECRET: Joi.string().required(),
    BASIC_AUTH_USERNAME: Joi.string().required(),
    BASIC_AUTH_PASSWORD: Joi.string().required(),
    EMAIL_PASSWORD: Joi.string().required(),
    EMAIL_USER: Joi.string().required(),
    EMAIL_SERVICE: Joi.string().required(),
    DATABASE_URL: Joi.string().uri().required(),
    POSTGRES_PASSWORD: Joi.string().optional(),
    ENV: Joi.string().required(),
  }),
});
