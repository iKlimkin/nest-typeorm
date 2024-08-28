import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetClientInfo = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const userAgentInfo = request.useragent;

    const forwardedIpsStr =
      request.headers['x-forwarded-for'] || request.socket.remoteAddress || '';

    const ip = forwardedIpsStr.split(',')[0];

    return { ip, userAgentInfo };
  },
);
