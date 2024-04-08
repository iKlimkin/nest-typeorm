import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigurationType } from '../../../../settings/config/configuration';

@Injectable()
export class SetUserIdGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<ConfigurationType>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractTokenFromHeaders(request);

    const jwtConfig = this.configService.get('jwtSettings', { infer: true });

    if (accessToken) {
      try {
        const userPayload = await this.jwtService.verifyAsync(accessToken, {
          secret: jwtConfig.ACCESS_TOKEN_SECRET,
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
    return type === 'Bearer' ? token : null;
  }
}
