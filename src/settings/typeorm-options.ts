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
  UserAccount,
} from '.';

@Injectable()
export class TypeOrmOptions implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService<ConfigurationType>) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const env = this.configService.getOrThrow('env');

    if (
      env?.toUpperCase() === 'DEVELOPMENT' ||
      env?.toUpperCase() === 'TESTING'
    ) {
      return this.createLocalConnection();
    } else {
      // make remote connection
    }
  }

  private createLocalConnection(): TypeOrmModuleOptions {
    const { url, username, password, database } = this.configService.getOrThrow('pg', { infer: true });

    return {
      url,
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
      username,
      password,
      database,
      autoLoadEntities: false,
      synchronize: false,
      dropSchema: false,
    };
  }
}
