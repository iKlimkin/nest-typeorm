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

export const getEntities = () => [
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
];

const connectionUrl = (): string => {
  let url = '';

  if (process.env.DB_CONNECTION === 'local') {
    url = process.env.DATABASE_URL;
  } else {
    url = process.env.DATABASE_REMOTE_URL;
  }

  const connectionLog = url.startsWith('postgres:') ? 'local' : 'remote';
  console.log(`Migration to ${connectionLog} database`);

  return url;
};
export default new DataSource({
  url: connectionUrl(),
  type: 'postgres',
  migrations: ['migrations/*.ts'],
  entities: getEntities(),
  synchronize: false,
});
