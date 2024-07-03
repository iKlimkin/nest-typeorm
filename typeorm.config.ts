import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  TemporaryUserAccount,
  Blog,
  Post,
  Comment,
  UserSession,
  PostReaction,
  PostReactionCounts,
  CommentReaction,
  CommentReactionCounts,
  UserAccount,
  QuizAnswer,
  QuizGame,
  QuizQuestion,
  QuizPlayerProgress,
  QuizCorrectAnswer,
  CurrentGameQuestion,
} from './src/settings';

config();

export default new DataSource({
  url: process.env.DATABASE_REMOTE_URL,
  type: 'postgres',
  migrations: ['migrations/*.ts'],
  // entities: [__dirname + '/../**/*.entity.js']
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
});
