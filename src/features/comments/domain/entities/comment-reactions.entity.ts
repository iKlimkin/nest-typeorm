import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import { LikesStatuses } from '../../../../domain/reaction.models';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import type { Comment } from './comment.entity';

@Entity()
// @Unique(['userAccount', 'comment'])
export class CommentReaction extends BaseEntity {
  @Column()
  reactionType: LikesStatuses;

  @ManyToOne('Comment', 'commentReactions', { onDelete: 'CASCADE' })
  @JoinColumn()
  comment: Comment;

  @ManyToOne('UserAccount', 'commentReactions')
  @JoinColumn()
  userAccount: UserAccount;
}
