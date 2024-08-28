import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const RawBodyAndSignature = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];
    const rawBody = (request as any).rawBody;

    return { signature, rawBody };
  },
);
