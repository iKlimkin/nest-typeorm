import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import { likesStatus } from '../../../../domain/likes.types';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import type { Post } from './post.entity';

@Entity()
// @Unique(['user', 'post'])
export class PostReaction extends BaseEntity {
  @Column()
  reaction_type: likesStatus;

  @Column()
  user_login: string;

  @ManyToOne('Post', 'postReactions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne('UserAccount', 'postReactions')
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;
}
