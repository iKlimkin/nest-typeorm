import { Column, Entity, JoinColumn, OneToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import type { Post } from './post.entity';

@Entity()
@Unique(['post'])
export class PostReactionCounts extends BaseEntity {
  @OneToOne('Post', 'postReactionCounts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'integer' })
  likes_count: number;

  @Column({ type: 'integer' })
  dislikes_count: number;
}
