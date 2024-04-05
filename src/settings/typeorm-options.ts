import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigurationType } from './config/configuration';

@Injectable()
export class TypeOrmOptions implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const nodeEnv = this.configService.getOrThrow<ConfigurationType>('env', {
      infer: true,
    });

    if (
      (nodeEnv && nodeEnv.toUpperCase() === 'DEVELOPMENT') ||
      nodeEnv.toUpperCase() === 'TESTING'
    ) {
      console.log('dev');
      return this.createLocalConnection();
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
      database: 'nest-typeorm',
      autoLoadEntities: true,
      synchronize: true,
    };
  }
}
