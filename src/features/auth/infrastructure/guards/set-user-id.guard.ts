import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from '../../features/auth/infrastructure/guards/constants';

@Injectable()
export class SetUserIdGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractTokenFromHeaders(request);

    if (accessToken) {
      try {
        const userPayload = await this.jwtService.verifyAsync(accessToken, {
          secret: jwtConstants.jwt_access_secret,
        });
        request.userId = userPayload.userId;
      } catch (error) {
        // console.error(`invalid accessToken ${error}`);
        return true;
      }
    }

    return true;
  }

  private extractTokenFromHeaders(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return (type && type === 'Bearer') ? token : null;
  }
}
