import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';
import { ConfigurationType } from '../../../../../settings/config/configuration';

@Injectable()
export class BasicSAStrategy extends PassportStrategy(BasicStrategy) {
  constructor(private configService: ConfigService<ConfigurationType>) {
    super();
  }

  public validate = async (
    username: string,
    password: string,
  ): Promise<boolean> => {
    const { USERNAME, PASSWORD } = this.configService.get('basicAuth', {
      infer: true,
    });

    if (USERNAME === username && PASSWORD === password) {
      return true;
    }

    throw new UnauthorizedException();
  };
}
