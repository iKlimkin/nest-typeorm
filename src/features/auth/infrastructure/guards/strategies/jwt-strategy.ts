import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SecurityQueryRepo } from '../../../../security/api/query-repositories/security.query.repo';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../../../../settings/config/configuration';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-token',
) {
  constructor(
    private securityQueryRepo: SecurityQueryRepo,
    private configService: ConfigService<ConfigurationType>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwtSettings', { infer: true })
        .ACCESS_TOKEN_SECRET,
    });
  }

  async validate(payload: any) {
    const userSession = await this.securityQueryRepo.getUserSession(
      payload.deviceId,
    );

    if (!userSession) return false;

    return { ...payload };
  }
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    private securityQueryRepo: SecurityQueryRepo,
    private configService: ConfigService<ConfigurationType>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwtSettings', { infer: true })
        .REFRESH_TOKEN_SECRET,
    });
  }

  async validate(payload: any) {
    const { iat, deviceId } = payload;

    const tokenIssuedAt = new Date(iat * 1000).toISOString();

    const userSession = await this.securityQueryRepo.getUserSession(deviceId);

    if (!userSession || tokenIssuedAt !== userSession.lastActiveDate) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { ...payload };
  }
}

const cookieExtractor = (request: Request): string => {
  return request.cookies.refreshToken || request.headers.cookie?.split('=')[1];
};
