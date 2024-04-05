import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { providers } from '../../settings/app-providers';
import { controllers } from './infrastructure/settings/auth-controllers';
import { authEntities } from './infrastructure/settings/auth-entities';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule,
    CqrsModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 10000,
        limit: 50,
      },
    ]),
    TypeOrmModule.forFeature(authEntities),
  ],
  providers,
  controllers,
  exports: [JwtModule, CqrsModule],
})
export class AuthModule {}
