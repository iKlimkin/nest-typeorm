import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import type { Blog } from '../../../blogs/domain/entities/blog.entity';
import type { PostReaction } from './post-reactions.entity';
import type { Comment } from '../../../comments/domain/entities/comment.entity';
import { BaseEntity } from '../../../../domain/base-entity';
import type { PostReactionCounts } from './post-reaction-counts.entity';
import type { UserAccount } from '../../../auth/infrastructure/settings';

@Entity()
export class Post extends BaseEntity {
  @Column()
  title: string;

  @Column()
  short_description: string;

  @Column()
  blog_title: string;

  @Column()
  content: string;

  @ManyToOne('Blog', 'posts')
  @JoinColumn({ name: 'blog_id' })
  blog: Blog;

  @ManyToOne('UserAccount', 'posts')
  user: UserAccount;

  @OneToMany('Comment', 'post')
  comments: Comment[];

  @OneToMany('PostReaction', 'post')
  postReactions: PostReaction[];

  @OneToOne('PostReactionCounts', 'post')
  postReactionCounts: PostReactionCounts;
}
