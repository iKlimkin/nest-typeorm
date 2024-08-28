import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class StripeSignatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const signature = request.headers['stripe-signature'];

    if (!signature) {
      throw new BadRequestException();
    }

    return true;
  }
}
