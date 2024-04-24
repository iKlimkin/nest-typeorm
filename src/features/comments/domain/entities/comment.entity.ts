import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import type { Post } from '../../../posts/domain/entities/post.entity';
import type { CommentReactionCounts } from './comment-reaction-counts.entity';
import type { CommentReaction } from './comment-reactions.entity';
import { BaseEntity } from '../../../../domain/base-entity';

@Entity()
export class Comment extends BaseEntity {
  @Column()
  userLogin: string;

  @Column()
  content: string;

  @ManyToOne('Post', 'comments')
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne('UserAccount', 'comments')
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @OneToMany('CommentReaction', 'comment')
  commentReactions: CommentReaction[];

  @OneToOne('CommentReactionCounts', 'comment')
  commentReactionCounts: CommentReactionCounts;
}
