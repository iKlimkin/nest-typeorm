import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { Comment } from './comment.entity';

@Entity()
@Unique(['comment'])
export class CommentReactionCounts extends BaseEntity {
  @OneToOne('Comment', 'commentReactionCounts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: Comment;

  @Column({ type: 'integer' })
  likes_count: number;

  @Column({ type: 'integer' })
  dislikes_count: number;
}
