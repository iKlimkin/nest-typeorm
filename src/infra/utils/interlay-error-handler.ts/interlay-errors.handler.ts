import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GetErrors } from './error-constants';
import { LayerInterceptorExtension } from './error-layer-interceptor';

export const handleErrors = (
  code: number,
  extension: LayerInterceptorExtension,
) => {
  const { key, message } = extension;
  const descriptionOrOptions = {
    cause: extension.key,
    description: extension.message,
  };

  const errorObject = {
    message,
    statusCode: code,
    key,
  };

  switch (code) {
    case GetErrors.DatabaseFail:
      return {
        error: new InternalServerErrorException(errorObject),
      };
    case GetErrors.NotFound:
      return {
        message: extension.message,
        error: new NotFoundException(errorObject),
      };
    case GetErrors.IncorrectModel:
      return {
        message: extension.message,
        error: new BadRequestException(errorObject),
      };

    case GetErrors.Forbidden:
      return {
        message: extension.message,
        error: new ForbiddenException(errorObject),
      };
    default:
      return {
        message: 'An unexpected error occurred',
        error: new Error('An unexpected error occurred'),
      };
  }
};
