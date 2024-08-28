import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ConfigurationType } from '../../settings/config/configuration';

type ErrorResponse = {
  errorsMessages: ErrorsMessageType[];
};
type ErrorsMessageType = {
  message?: string;
  field?: string;
};

// @Catch(Error)
// export class AllExceptionsFilter implements ExceptionFilter {
//   catch(error: Error, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();

//     const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
//     const errorMessage = error.message || 'Internal Server Error';
//     console.log({errorMessage, statusCode});

//     response.status(statusCode).json({
//       statusCode,
//       timestamp: new Date().toISOString(),
//       error: errorMessage,
//       path: request.url,
//     });
//   }
// }

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private config: ConfigService<ConfigurationType>) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { message, key, statusCode } = exception.getResponse() as any;

    let devErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      location: key,
      error: message,
      path: request.url,
      errorName: exception?.name,
    };

    if (statusCode === HttpStatus.BAD_REQUEST) {
      const prodErrorResponse: ErrorResponse = {
        errorsMessages: [],
      };
      if (Array.isArray(message)) {
        message.forEach((m: ErrorsMessageType) => {
          prodErrorResponse.errorsMessages.push(m);
        });
      } else {
        prodErrorResponse.errorsMessages.push({ message });
      }

      const env = this.config.getOrThrow('env').toUpperCase();

      const envCondition = env === 'DEVELOPMENT' || env === 'TESTING';

      const errorResponse = !envCondition
        ? devErrorResponse
        : prodErrorResponse;

      response.status(statusCode).send(errorResponse);
    } else {
      response.status(statusCode).json(devErrorResponse);
    }
  }
}
