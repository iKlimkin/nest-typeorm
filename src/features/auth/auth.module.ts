import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersRepository } from '../admin/infrastructure/users.repo';
import { controllers } from './infrastructure/settings/auth-controllers';
import { authEntities } from './infrastructure/settings/auth-entities';
import { providers } from './infrastructure/settings/auth-providers';
import { BlogsQueryRepo } from '../blogs/api/query-repositories/blogs.query.repo';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule,
    CqrsModule,
    ThrottlerModule.forRoot([{ ttl: 10000, limit: 50 }]),
    TypeOrmModule.forFeature(authEntities),
  ],
  providers,
  controllers,
  exports: [JwtModule, CqrsModule, UsersRepository, BlogsQueryRepo],
})
export class AuthModule {}
