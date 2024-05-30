import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import type { Blog } from '../../../blogs/domain/entities/blog.entity';
import type { CommentReaction } from '../../../comments/domain/entities/comment-reactions.entity';
import type { Comment } from '../../../comments/domain/entities/comment.entity';
import type { PostReaction } from '../../../posts/domain/entities/post-reactions.entity';
import type { UserSession } from '../../../security/domain/entities/security.entity';
import { BaseEntity } from '../../../../domain/base-entity';
import { add } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import type { QuizPlayerProgress } from '../../../quiz/domain/entities/quiz-player-progress.entity';
import type { Post } from '../../../posts/domain/entities/post.entity';

type UserDataType = {
  login: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
};

@Entity()
export class UserAccount extends BaseEntity {
  @Column()
  login: string;

  @Column()
  email: string;

  @Column()
  password_salt: string;

  @Column()
  password_hash: string;

  @Column()
  confirmation_code: string;

  @Column()
  confirmation_expiration_date: Date;

  @Column()
  is_confirmed: boolean;

  @Column({ nullable: true })
  password_recovery_code: string;

  @Column({ nullable: true })
  password_recovery_expiration_date: Date;

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

  static create(userData: UserDataType): UserAccount {
    const { login, email, passwordSalt, passwordHash } = userData;

    const user = new UserAccount();
    user.login = login;
    user.email = email;
    user.password_salt = passwordSalt;
    user.password_hash = passwordHash;
    user.confirmation_code = uuidv4();
    user.confirmation_expiration_date = add(new Date(), {
      hours: 1,
      minutes: 15,
    });
    user.is_confirmed = false;
    return user;
  }
}
