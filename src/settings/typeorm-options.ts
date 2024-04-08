import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigurationType } from './config/configuration';

@Injectable()
export class TypeOrmOptions implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService<ConfigurationType>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const env = this.configService.getOrThrow('env');

    if (
      env?.toUpperCase() === 'DEVELOPMENT' ||
      env?.toUpperCase() === 'TESTING'
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
