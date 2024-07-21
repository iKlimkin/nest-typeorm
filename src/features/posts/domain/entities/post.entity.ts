import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import {
  contentLength,
  frequentLength,
  titleLength,
} from '../../../../domain/validation.constants';
import { iSValidField } from '../../../../infra/decorators/transform/transform-params';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import type { Blog } from '../../../../settings';
import type { Comment } from '../../../comments/domain/entities/comment.entity';
import { CreatePostDto } from '../../api/models/dto/post.dto.model';
import type { PostReactionCounts } from './post-reaction-counts.entity';
import type { PostReaction } from './post-reactions.entity';
import { UpdateBloggerPostDto } from '../../api/models/input.posts.models/create.post.model';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';

@Entity()
export class Post extends BaseEntity {
  @Column()
  @iSValidField(titleLength)
  title: string;

  @Column()
  @iSValidField(frequentLength)
  shortDescription: string;

  @Column()
  blogTitle: string;

  @Column()
  @iSValidField(contentLength)
  content: string;

  @ManyToOne('Blog', 'posts')
  @JoinColumn()
  blog: Blog;

  @Column()
  blogId: string;

  @ManyToOne('UserAccount', 'posts')
  user: UserAccount;

  @OneToMany('Comment', 'post')
  comments: Comment[];

  @OneToMany('PostReaction', 'post')
  postReactions: PostReaction[];

  @OneToOne('PostReactionCounts', 'post')
  postReactionCounts: PostReactionCounts;

  static async create(createPostDto: CreatePostDto) {
    const { blog, content, shortDescription, title } = createPostDto;
    const notice = new LayerNoticeInterceptor<Post>();

    const newPost = new Post();
    newPost.content = content;
    newPost.shortDescription = shortDescription;
    newPost.title = title;
    newPost.blogTitle = blog.title;
    newPost.blog = blog;
    newPost.blogId = blog.id;

    await notice.validateFields(newPost);
    notice.addData(newPost);
    return notice;
  }

  async updatePost(
    updatePostDto: UpdateBloggerPostDto,
  ): Promise<LayerNoticeInterceptor<Post>> {
    const { content, shortDescription, title } = updatePostDto;
    const notice = new LayerNoticeInterceptor<Post>();

    this.content = content;
    this.shortDescription = shortDescription;
    this.title = title;

    await notice.validateFields(this);
    notice.addData(this);
    return notice;
  }
}
