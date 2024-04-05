import { Column, Entity, OneToMany } from 'typeorm';
import type { Blog } from '../../../blogs/domain/entities/blog.entity';
import type { CommentReaction } from '../../../comments/domain/entities/comment-reactions.entity';
import type { Comment } from '../../../comments/domain/entities/comment.entity';
import type { PostReaction } from '../../../posts/domain/entities/post-reactions.entity';
import type { UserSession } from '../../../security/domain/entities/security.entity';
import { BaseEntity } from '../../../../domain/base-entity';

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

  @OneToMany('Blog', 'userAccount')
  blogs: Blog[];

  @OneToMany('Comment', 'userAccount')
  comments: Comment[];

  @OneToMany('UserSession', 'userAccount')
  userSessions: UserSession[];

  @OneToMany('PostReaction', 'user')
  postReactions: PostReaction[];

  @OneToMany('CommentReaction', 'userAccount')
  commentReactions: CommentReaction[];
}
