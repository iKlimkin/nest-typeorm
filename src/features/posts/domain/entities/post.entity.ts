import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne
} from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { UserAccount } from '../../../auth/infrastructure/settings';
import type { Comment } from '../../../comments/domain/entities/comment.entity';
import type { PostReactionCounts } from './post-reaction-counts.entity';
import type { PostReaction } from './post-reactions.entity';


@Entity()
export class Post extends BaseEntity {
  @Column()
  title: string;

  @Column()
  short_description: string;

  @Column()
  blog_title: string;

  @Column({  })
  content: string;

  // @ManyToOne('Blog', 'posts')
  // @JoinColumn({ name: 'blog_id' })

  @Column({ unique: true })
  blogId: string;

  @ManyToOne('UserAccount', 'posts')
  user: UserAccount;

  @OneToMany('Comment', 'post')
  comments: Comment[];

  @OneToMany('PostReaction', 'post')
  postReactions: PostReaction[];

  @OneToOne('PostReactionCounts', 'post')
  postReactionCounts: PostReactionCounts;
}
