import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorsMessageType = {
  message: string;
  field: string;
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
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { message, key, statusCode } = exception.getResponse() as any;

    if (statusCode === HttpStatus.BAD_REQUEST) {
      const errorResponse: any = {
        errorsMessages: [],
      };

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
