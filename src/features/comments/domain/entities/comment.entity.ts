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
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { CreateCommentDtoType } from '../../api/models/output.comment.models/comment.models';

@Entity()
export class Comment extends BaseEntity {
  @Column()
  userLogin: string;

  @Column()
  content: string;

  @ManyToOne('Post', 'comments')
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne('UserAccount', 'comments', { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: UserAccount;

  @OneToMany('CommentReaction', 'comment')
  commentReactions: CommentReaction[];

  @OneToOne('CommentReactionCounts', 'comment')
  commentReactionCounts: CommentReactionCounts;

  static async create(createCommentDto: CreateCommentDtoType) {
    const notice = new LayerNoticeInterceptor<Comment>();
    const { postId, userId, login, content } = createCommentDto;
    const newComment = new Comment();
    newComment.post = { id: postId } as Post;
    newComment.user = { id: userId } as UserAccount;
    newComment.userLogin = login;
    newComment.content = content;

    await notice.validateFields(newComment);
    notice.addData(newComment);
    return notice;
  }
}
