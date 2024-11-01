import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';
import { StrategyType } from '../../../../../infra/enum/strategy.enum';
import { ConfigurationType } from '../../../../../settings/config/configuration';

@Injectable()
export class GithubStrategy extends PassportStrategy(
  Strategy,
  StrategyType.Github,
) {
  constructor(private configService: ConfigService<ConfigurationType>) {
    super({
      clientID: configService.get('github').client_id,
      clientSecret: configService.get('github').client_secret,
      callbackURL: configService.get('github').redirect_url,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const email = profile.emails[0];

    return {
      id: profile.id,
      displayName: profile.displayName,
      profile,
    };
  }
}
