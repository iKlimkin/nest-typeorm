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
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (status === HttpStatus.BAD_REQUEST) {
      const errorResponse: any = {
        errorsMessages: [],
      };
      const { message }: any = exception.getResponse();
      
      if (Array.isArray(message)) {
        message.forEach((m: ErrorsMessageType) =>
          errorResponse.errorsMessages.push(m),
        );
      } else {
        errorResponse.errorsMessages.push({ message });
      }

      response.status(status).send(errorResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        error: exception.message,
        path: request.url,
      });
    }
  }
}
