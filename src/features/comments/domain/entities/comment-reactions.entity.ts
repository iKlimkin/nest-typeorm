import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import { likesStatus } from '../../../../domain/likes.types';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { Comment } from './comment.entity';

@Entity()
@Unique(['userAccount', 'comment'])
export class CommentReaction extends BaseEntity {
  @Column()
  reaction_type: likesStatus;

  @ManyToOne('Comment', 'commentReactions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @ManyToOne('UserAccount', 'commentReactions')
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;
}
