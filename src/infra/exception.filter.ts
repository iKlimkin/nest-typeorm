import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorsMessageType = {
  message: string;
  field: string;
};


@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    debugger
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { message, key, statusCode } = exception.getResponse() as any;

    if (statusCode === HttpStatus.BAD_REQUEST) {
      const errorResponse: any = {
        errorsMessages: [],
      };
      // const { message }: any = exception.getResponse();
      
      if (Array.isArray(message)) {
        message.forEach((m: ErrorsMessageType) =>
          errorResponse.errorsMessages.push(m),
        );
      } else {
        errorResponse.errorsMessages.push({ message });
      }

      response.status(statusCode).send(errorResponse);
    } else {
      response.status(statusCode).json({
        statusCode,
        timestamp: new Date().toISOString(),
        location: key,
        error: message,
        path: request.url,
      });
    }
  }
}
