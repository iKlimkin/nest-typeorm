import { add } from 'date-fns';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../../../domain/base-entity';
import type { UserBans } from '../../../auth/domain/entities/user-bans.entity';
import type { Blog } from '../../../blogs/domain/entities/blog.entity';
import type { CommentReaction } from '../../../comments/domain/entities/comment-reactions.entity';
import type { Comment } from '../../../comments/domain/entities/comment.entity';
import type { PostReaction } from '../../../posts/domain/entities/post-reactions.entity';
import type { Post } from '../../../posts/domain/entities/post.entity';
import type { QuizPlayerProgress } from '../../../quiz/domain/entities/quiz-player-progress.entity';
import type { UserSession } from '../../../security/domain/entities/security.entity';
import type { UserBloggerBans } from '../../../blogs/domain/entities/user-blogger-bans.entity';
import { TelegramMetaUser } from '../../../integrations/telegram/domain/entities/telegram-meta-user.entity';
import { PaymentTransactionPlan } from '../../../integrations/payments/domain/entities/payment-transaction-plan.entity';
import { MembershipBlogPlan } from '../../../integrations/payments/domain/entities/membership-blog-plan.entity';
import { BlogNotifySubscription } from '../../../blogs/domain/entities/blog-subscription.entity';
import { ProviderType } from '../../../auth/infrastructure/models/provider.enum';

type UserDataType = {
  login: string;
  email: string;
  passwordHash?: string;
  isConfirmed: boolean;
  providerId?: string;
};

@Entity()
export class UserAccount extends BaseEntity {
  @Column({ unique: true, collation: 'C' })
  login: string;

  @Column({ unique: true, collation: 'C' })
  email: string;

  @Column({ nullable: true })
  password_hash: string;

  @Column({ nullable: true })
  confirmation_code: string;

  @Column({ nullable: true })
  confirmation_expiration_date: Date;

  @Column()
  is_confirmed: boolean;

  @Column({ nullable: true })
  providerId: string;

  @Column({ nullable: true, enum: ProviderType })
  provider: ProviderType;

  @Column({ nullable: true })
  password_recovery_code: string;

  @Column({ nullable: true })
  password_recovery_expiration_date: Date;

  @OneToOne(() => TelegramMetaUser, (tgMeta) => tgMeta.user)
  telegramMeta: TelegramMetaUser;

  @OneToMany('UserSession', 'userAccount', { nullable: true })
  userSessions: UserSession[];

  @OneToMany('Blog', 'user', { nullable: true })
  blogs: Blog[];

  @OneToMany('Post', 'user', { nullable: true })
  posts: Post[];

  @OneToMany('Comment', 'user', { nullable: true })
  comments: Comment[];

  @OneToMany('PostReaction', 'user', { nullable: true })
  postReactions: PostReaction[];

  @OneToMany('CommentReaction', 'userAccount', { nullable: true })
  commentReactions: CommentReaction[];

  @OneToMany('QuizPlayerProgress', 'player', { nullable: true })
  gameProgress: QuizPlayerProgress[];

  @OneToOne('UserBans', 'user', { nullable: true })
  userBan: UserBans;

  @OneToMany('UserBloggerBans', 'user', { nullable: true })
  bloggerBans: UserBloggerBans[];

  @OneToMany(() => BlogNotifySubscription, (subs) => subs.user)
  subscriptions: BlogNotifySubscription[];

  @OneToMany(() => MembershipBlogPlan, (membershipPlan) => membershipPlan.user)
  membershipPlans: MembershipBlogPlan[];

  @OneToMany(() => PaymentTransactionPlan, (plan) => plan.user)
  paymentTransactions: PaymentTransactionPlan[];

  static create(userData: UserDataType) {
    const { login, email, passwordHash, providerId } = userData;

    const user = new UserAccount();
    user.login = login;
    user.email = email;
    user.password_hash = passwordHash;
    user.confirmation_code = uuidv4();
    user.confirmation_expiration_date = add(new Date(), {
      hours: 1,
      minutes: 15,
    });
    user.is_confirmed = userData.isConfirmed;
    user.providerId = providerId || null;
    return user;
  }
}
