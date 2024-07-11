import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigurationType, PgConnectionType } from './config/configuration';
import { getEntities } from '../../typeorm.config';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Injectable()
export class TypeOrmOptions implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService<ConfigurationType>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const env = this.configService.getOrThrow('env').toUpperCase();
    const pgConnection = this.configService.getOrThrow('pg');
    let connectionOptions: TypeOrmModuleOptions;
    const entities = getEntities();

    if (env === 'DEVELOPMENT' || env === 'TESTING') {
      connectionOptions = this.createLocalConnection(pgConnection, entities);
    } else {
      connectionOptions = this.createRemoteConnection(pgConnection, entities);
    }

    return connectionOptions;
  }

  private createLocalConnection(
    connection: PgConnectionType,
    entities: EntityClassOrSchema[],
  ): TypeOrmModuleOptions {
    try {
      const { url, username, password, database, type } = connection;

      return {
        url,
        type,
        entities,
        username,
        password,
        database,
        autoLoadEntities: false,
        synchronize: false,
        dropSchema: false,
      };
    } catch (error) {
      console.log(error);
    }
  }

  private createRemoteConnection(
    connection: PgConnectionType,
    entities: EntityClassOrSchema[],
  ): TypeOrmModuleOptions {
    console.log(`remote connection`);
    return {
      url: connection.url,
      type: connection.type,
      entities,
      autoLoadEntities: false,
      synchronize: false,
      dropSchema: false,
    };
  }
}
