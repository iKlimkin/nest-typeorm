import { Inject, Injectable, LoggerService } from '@nestjs/common';
import logger from 'pino';
import { ASYNC_STORAGE } from './logger.constants';
import { AsyncLocalStorage } from 'async_hooks';
const pino = logger({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      colorize: true,
    },
  },
});

export type Storage = Map<string, string>;
@Injectable()
export class PinoLoggerService implements LoggerService {
  constructor(
    @Inject(ASYNC_STORAGE)
    private readonly asyncStorage: AsyncLocalStorage<Map<string, string>>,
  ) {}
  private getMessage(message: any, context: any[]) {
    return context ? `[ ${context} ] ${message}` : message;
  }

  error(message: any, trace?: string, context?: any[]) {
    const traceId = this.asyncStorage.getStore()?.get('traceId');
    pino.error({ traceId }, this.getMessage(message, context));
    if (trace) {
      pino.error(trace);
    }
  }
  log(message: any, context: any[]) {
    const traceId = this.asyncStorage.getStore()?.get('traceId');
    pino.info({ traceId }, this.getMessage(message, context));
  }
  warn(message: any, context: any[]) {
    const traceId = this.asyncStorage.getStore()?.get('traceId');
    pino.warn({ traceId }, this.getMessage(message, context));
  }
}
