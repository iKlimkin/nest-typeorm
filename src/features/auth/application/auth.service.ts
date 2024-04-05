import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  VerifyTokensType,
  TokensMeta,
  Payload,
  JwtTokens,
} from '../api/models/auth-input.models.ts/jwt.types';
import { jwtConstants } from '../infrastructure/guards/constants';
import { UserInfoType } from '../api/models/auth-input.models.ts/user-info';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async getTokens(userId: string): Promise<JwtTokens> {
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
    payload: UserInfoType,
  ): Promise<[accessToken: string, refreshToken: string]> {
    return Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.jwt_access_secret,
        expiresIn: '10h',
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConstants.jwt_refresh_secret,
        expiresIn: '20h',
      }),
    ]);
  }
}
