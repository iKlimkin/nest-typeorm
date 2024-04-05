import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { configModule } from './settings/app-config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmOptions } from './settings/typeorm-options';
import { entities } from './settings/entities';
import { controllers } from './settings/app-controllers';
import { providers } from './settings/app-providers';
import { AuthModule } from './features/auth/auth.module';

@Module({
  imports: [
    configModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useClass: TypeOrmOptions,
    }),
    TypeOrmModule.forFeature(entities),
    AuthModule,
  ],
  controllers,
  providers,
})
export class AppModule {}
