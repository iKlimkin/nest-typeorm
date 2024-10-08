import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  VerifyTokensType,
  TokensMeta,
  Payload,
  JwtTokens,
} from '../api/models/auth-input.models.ts/jwt.types';
import { UserSessionDto } from '../../security/api/models/security-input.models/security-session-info.model';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../../settings/config/configuration';
import { CaptureAdapter } from '../../../infra/adapters/capture.adapter';

@Injectable()
export class AuthService {
  private jwtConfig: ConfigurationType['jwtSettings'];
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService<ConfigurationType>,
    private captureAdapter: CaptureAdapter,
  ) {
    this.jwtConfig = this.configService.get('jwtSettings', {
      infer: true,
    });
  }

  async validateCaptureToken(token: string) {
    return this.captureAdapter.isValid(token);
  }

  async createTokenPair(userId: string): Promise<JwtTokens> {
    const deviceId = uuidv4();
    const payload = { userId, deviceId };
    const [accessToken, refreshToken] = await this.createNewTokens(payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  async getUserInfoByToken(
    inputToken: VerifyTokensType,
  ): Promise<TokensMeta | null> {
    try {
      const decodedData = await this.jwtService.verifyAsync(inputToken.token, {
        secret: inputToken.secret,
      });
      return decodedData as TokensMeta;
    } catch (err) {
      console.error(`Troubleshoots with ${inputToken.tokenType}: `, err);
      return null;
    }
  }

  getUserPayloadByToken(token: string): Payload | null {
    try {
      return this.jwtService.decode(token) as Payload;
    } catch (error) {
      console.error(`Troubleshoots with getting user's payload`, error);
      return null;
    }
  }

  async updateUserTokens(userId: string, deviceId: string): Promise<JwtTokens> {
    const payload = { userId, deviceId };
    const [accessToken, refreshToken] = await this.createNewTokens(payload);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async createNewTokens(
    payload: UserSessionDto,
  ): Promise<[accessToken: string, refreshToken: string]> {
    return Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.ACCESS_TOKEN_SECRET,
        expiresIn: '10h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.REFRESH_TOKEN_SECRET,
        expiresIn: '20h',
      }),
    ]);
  }
}
