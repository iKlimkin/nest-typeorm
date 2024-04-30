import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigurationType } from './config/configuration';
import {
  Blog,
  CommentReaction,
  CommentReactionCounts,
  CurrentGameQuestion,
  Post,
  PostReaction,
  PostReactionCounts,
  QuizAnswer,
  QuizCorrectAnswer,
  QuizGame,
  QuizPlayerProgress,
  QuizQuestion,
  TemporaryUserAccount,
  UserSession,
  Comment,
} from '.';
import { UserAccount } from '../features/auth/infrastructure/settings';

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
      // logging: ['query', 'error'],
      entities: [
        TemporaryUserAccount,
        Comment,
        Post,
        Blog,
        UserSession,
        PostReaction,
        PostReactionCounts,
        CommentReaction,
        CommentReactionCounts,
        UserAccount,
        UserSession,
        TemporaryUserAccount,
        QuizAnswer,
        QuizGame,
        QuizQuestion,
        QuizPlayerProgress,
        QuizCorrectAnswer,
        CurrentGameQuestion,
      ],
      // entities: ['src/**/*.entity.ts'],
      // entities: [__dirname + '/../**/*.entity.js'],
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.typeormPostgresDbName,
      autoLoadEntities: true,
      synchronize: true,
    };
  }
}
