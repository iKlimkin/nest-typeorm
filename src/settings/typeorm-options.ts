import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigurationType } from './config/configuration';

@Injectable()
export class TypeOrmOptions implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const nodeEnv = this.configService.getOrThrow<ConfigurationType>('ENV', {
      infer: true,
    }).env;

    if (
      (nodeEnv && nodeEnv.toUpperCase() === 'DEVELOPMENT') ||
      nodeEnv.toUpperCase() === 'TESTING'
    ) {
      console.log('dev');
      return this.createLocalConnection();
    } else {
      console.log('prod');
      return this.createRemoteConnection();
    }
  }

  private createLocalConnection(): TypeOrmModuleOptions {
    console.log('local connection postgres');
    return {
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      logging: ['query', 'error'],
      username: 'NodeJS',
      password: 'NodeJS',
      database: 'InteractHubNest',
      autoLoadEntities: true,
      synchronize: false,
    };
  }

  private createRemoteConnection(): TypeOrmModuleOptions {
    console.log(this.configService.get('PG_REMOTE_URL'));
    return {
      url: this.configService.get<string>('PG_REMOTE_URL') || '',
      type: 'postgres',
      autoLoadEntities: true,
      synchronize: true,
      ssl: true,
    };
  }
}
