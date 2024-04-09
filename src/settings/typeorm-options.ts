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
    } else {
      // make remote connection
    }
  }

  private createLocalConnection(): TypeOrmModuleOptions {
    const dbConfig = this.configService.getOrThrow('pg', { infer: true });

    return {
      url: dbConfig.url,
      type: 'postgres',
      logging: ['query', 'error'],
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.typeormPostgresDbName,
      autoLoadEntities: false,
      synchronize: false,
    };
  }
}
