import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { LayerInterceptorExtension } from './error-layer-interceptor';
import { GetErrors } from './error-constants';

export const handleErrors = (
  code: number,
  extension: LayerInterceptorExtension[],
) => {
  switch (code) {
    case GetErrors.DatabaseFail:
      return {
        message: 'Internal Server Error',
        error: new InternalServerErrorException(extension[0]),
      };
    case GetErrors.NotFound:
      return {
        message: 'Not Found',
        error: new NotFoundException(extension[0]),
      };
    case GetErrors.IncorrectModel:
      return {
        message: 'Bad Request',
        error: new BadRequestException(extension[0]),
      };
    default:
      return {
        message: 'An unexpected error occurred',
        error: new Error('An unexpected error occurred'),
      };
  }
};
