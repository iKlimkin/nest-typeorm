import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import type { Post } from '../../../posts/domain/entities/post.entity';
import { BaseEntity } from '../../../../domain/base-entity';

@Entity()
export class Blog extends BaseEntity {
  @Index('title', { unique: true })
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  website_url: string;

  @Column()
  is_membership: boolean;

  @ManyToOne('UserAccount', 'blogs')
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @OneToMany('Post', 'blog')
  posts: Post[];
}
