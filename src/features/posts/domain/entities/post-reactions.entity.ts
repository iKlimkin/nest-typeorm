import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import { LikesStatuses } from '../../../../domain/reaction.models';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import type { Post } from './post.entity';

@Entity()
@Unique(['user', 'post'])
export class PostReaction extends BaseEntity {
  @Column()
  reactionType: LikesStatuses;

  @Column()
  userLogin: string;

  @ManyToOne('Post', 'postReactions', { onDelete: 'CASCADE' })
  @JoinColumn()
  post: Post;

  @ManyToOne('UserAccount', 'postReactions', { onDelete: 'NO ACTION' })
  @JoinColumn()
  user: UserAccount;
}
