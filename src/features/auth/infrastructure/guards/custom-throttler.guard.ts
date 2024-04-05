import {
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import {
  ThrottlerGenerateKeyFunction,
  ThrottlerGetTrackerFunction,
  ThrottlerGuard,
  ThrottlerOptions,
} from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  apiRequestCounterService: any;

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
    getTracker: ThrottlerGetTrackerFunction,
    generateKey: ThrottlerGenerateKeyFunction,
  ): Promise<boolean> {
    const { req, res } = this.getRequestResponse(context);

    const tracker = await this.getTracker(req);
    const key = this.generateKey(context, tracker, 'ip');

    const { totalHits, timeToExpire } = await this.storageService.increment(
      key,
      ttl,
    );

    const throttleDetail = {
      key,
      limit,
      timeToExpire,
      totalHits,
      tracker,
      ttl,
    };
    // console.log(throttleDetail);

    if (totalHits > limit) {
      res.header('Retry-After', timeToExpire);

      // this.throwThrottlingException(context, throttleDetail);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: 'Rate limit exceeded.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
