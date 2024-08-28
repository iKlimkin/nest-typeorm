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
import { BlogNotifySubscription } from './src/features/blogs/domain/entities/blog-subscription.entity';
import { BlogSubscriptionPlanModel } from './src/features/integrations/payments/domain/entities/blog-subscription-plan-model.entity';
import { TelegramMetaUser } from './src/features/integrations/telegram/domain/entities/telegram-meta-user.entity';
import { PaymentTransactionPlan } from './src/features/integrations/payments/domain/entities/payment-transaction-plan.entity';
import { MembershipBlogPlan } from './src/features/integrations/payments/domain/entities/membership-blog-plan.entity';

config();

export const getEntities = () => [
  MembershipBlogPlan,
  PaymentTransactionPlan,
  BlogNotifySubscription,
  TelegramMetaUser,
  BlogSubscriptionPlanModel,
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
  let env = process.env;
  let connection = env.DB_CONNECTION;

  let url = '';
  let connectionType = '';
  if (connection === 'local') {
    connectionType = 'local';
    url = env.DATABASE_URL;
  } else if (connection === 'docker') {
    connectionType = 'local-docker-container';
    url = env.DOCKER_URL;
  } else if (connection === 'remote') {
    connectionType = 'remote';
    url = env.DATABASE_REMOTE_URL;
  }

  console.log(`Migration to ${connectionType} database`);

  return url;
};

export default new DataSource({
  url: connectionUrl(),
  type: 'postgres',
  migrations: ['migrations/*.ts'],
  entities: getEntities(),
  synchronize: false,
});
