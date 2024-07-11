import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { AppModule } from '../app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationError, useContainer } from 'class-validator';
import {
  // AllExceptionsFilter,
  HttpExceptionFilter,
} from '../infra/exception.filter';
import { ConfigService } from '@nestjs/config';

export const applyAppSettings = (app: INestApplication) => {
  app.use(cookieParser());

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.enableCors();

  setAppPipes(app);

  setAppExceptionsFilters(app);
};

type CustomError = {
  message: string;
  field: string;
};

const setAppPipes = (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      exceptionFactory(errors: ValidationError[]) {
        const customErrors: CustomError[] = [];

        errors.forEach((errors: ValidationError) => {
          const constraints = errors.constraints;

          if (constraints) {
            const constraintKeys = Object.keys(constraints);

            constraintKeys.forEach((cKey: string) => {
              const message = constraints[cKey];

              customErrors.push({ message, field: errors.property });
            });
          }
        });

        throw new BadRequestException(customErrors);
      },
    }),
  );
};

const setAppExceptionsFilters = (app: INestApplication) => {
  const configService = app.get(ConfigService);
  app.useGlobalFilters(new HttpExceptionFilter(configService));
};
