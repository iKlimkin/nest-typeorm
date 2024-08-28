import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { StrategyType } from '../../../../../infra/enum/strategy.enum';
import { ConfigurationType } from '../../../../../settings/config/configuration';
import { AuthService } from '../../../application/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  StrategyType.Google,
) {
  constructor(
    private authService: AuthService,

    private configService: ConfigService<ConfigurationType>,
  ) {
    super({
      clientID: configService.get('google').client_id,
      clientSecret: configService.get('google').client_secret,
      callbackURL: configService.get('google').redirect_url,
      scope: ['email', 'profile'],
      session: false,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { id: providerId, emails, displayName, photos, provider } = profile;

    const email = emails?.[0]?.value;
    const photo = photos?.[0]?.value;

    if (!email || !photo) {
      return done(new Error('No provider info'), null);
    }

    const usersProvider = {
      email,
      userName: displayName,
      avatar: photo,
      providerId,
      provider,
    };

    done(null, usersProvider);
  }
}
