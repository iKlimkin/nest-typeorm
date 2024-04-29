import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { LayerInterceptorExtension } from './error-layer-interceptor';
import { GetErrors } from './error-constants';

export const handleErrors = (
  code: number,
  extension: LayerInterceptorExtension
) => {
  switch (code) {
    case GetErrors.DatabaseFail:
      return {
        message: extension.message,
        error: new InternalServerErrorException(
          `Error occurred in ${extension.key}`
        ),
      };
    case GetErrors.NotFound:
      return {
        message: extension.message,
        error: new NotFoundException(extension.key),
      };
    case GetErrors.IncorrectModel:
      return {
        message: extension.message,
        error: new BadRequestException(extension.key),
      };

    case GetErrors.Forbidden:
      return {
        message: extension.message,
        error: new ForbiddenException(extension.key),
      };
    default:
      return {
        message: 'An unexpected error occurred',
        error: new Error('An unexpected error occurred'),
      };
  }
};
