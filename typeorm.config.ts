import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import {
  Blog,
  CommentReaction,
  CommentReactionCounts,
  CurrentGameQuestion,
  Comment,
  Post,
  PostReaction,
  PostReactionCounts,
  QuizAnswer,
  QuizCorrectAnswer,
  QuizGame,
  QuizPlayerProgress,
  QuizQuestion,
  TemporaryUserAccount,
  UserAccount,
  UserBans,
  UserBloggerBans,
  UserSession,
  FileMetadata,
  BlogImage,
  PostImage,
} from '.';

config();

export const getEntities = () => [
  BlogImage,
  PostImage,
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
  UserBans,
  UserBloggerBans,
  UserSession,
  TemporaryUserAccount,
  QuizAnswer,
  QuizGame,
  QuizQuestion,
  QuizPlayerProgress,
  QuizCorrectAnswer,
  CurrentGameQuestion,
  FileMetadata,
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
