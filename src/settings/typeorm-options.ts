import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { ConfigurationType } from './config/configuration';
import { TemporaryUserAccount } from '../features/auth/domain/entities/temp-account.entity';
import { Comment } from '../features/comments/domain/entities/comment.entity';
import { Post } from '../features/posts/domain/entities/post.entity';
import { Blog } from '../features/blogs/domain/entities/blog.entity';
import { UserSession } from '../features/security/domain/entities/security.entity';
import { PostReaction } from '../features/posts/domain/entities/post-reactions.entity';
import { PostReactionCounts } from '../features/posts/domain/entities/post-reaction-counts.entity';
import { CommentReaction } from '../features/comments/domain/entities/comment-reactions.entity';
import { CommentReactionCounts } from '../features/comments/domain/entities/comment-reaction-counts.entity';
import { UserAccount } from '../features/admin/domain/entities/user-account.entity';
import { QuizAnswer } from '../features/quiz/domain/entities/quiz-answer.entity';
import { QuizGame } from '../features/quiz/domain/entities/quiz-game.entity';
import { QuizQuestion } from '../features/quiz/domain/entities/quiz-questions.entity';
import { QuizPlayerProgress } from '../features/quiz/domain/entities/quiz-player-progress.entity';
import { CurrentGameQuestion, QuizCorrectAnswer } from '.';

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
