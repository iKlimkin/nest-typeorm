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
import { IsFQDN, Length, Matches } from 'class-validator';
import {
  BlogCreationDto,
  UpdateBlogDto,
} from '../../api/models/dtos/blog-dto.model';
import { LayerNoticeInterceptor } from '../../api/controllers';
import {
  descriptionLength,
  nameLength,
  urlLength,
  urlMatching,
} from '../../../../domain/validation.constants';
import { iSValidField } from '../../../../infra/decorators/transform/transform-params';

@Entity()
export class Blog extends BaseEntity {
  // @Index('title', { unique: true })
  @iSValidField(nameLength)
  @Column()
  title: string;

  @Column()
  @iSValidField(descriptionLength)
  description: string;

  @Column()
  @Matches(urlMatching)
  @Length(urlLength.min, urlLength.max)
  websiteUrl: string;

  @Column()
  isMembership: boolean;

  @ManyToOne('UserAccount', 'blogs', { nullable: true })
  @JoinColumn({ name: 'ownerId' })
  user: UserAccount;

  @OneToMany('Post', 'blog')
  posts: Post[];

  static async create(createBlogDto: BlogCreationDto) {
    const notice = new LayerNoticeInterceptor<Blog>();
    const { description, isMembership, title, websiteUrl, user } =
      createBlogDto;

    const newBlog = new Blog();
    newBlog.title = title;
    newBlog.description = description;
    newBlog.websiteUrl = websiteUrl;
    newBlog.isMembership = isMembership;
    newBlog.user = user;

    await notice.validateFields(newBlog);
    notice.addData(newBlog);
    return notice;
  }

  async update(
    updateBlogDto: UpdateBlogDto,
  ): Promise<LayerNoticeInterceptor<Blog | null>> {
    const notice = new LayerNoticeInterceptor<Blog | null>();

    this.description = updateBlogDto.description;
    this.websiteUrl = updateBlogDto.websiteUrl;
    this.title = updateBlogDto.name;

    await notice.validateFields(this);
    notice.addData(this);
    return notice;
  }

  async boundWithUser(user: UserAccount) {
    const notice = new LayerNoticeInterceptor<Blog | null>();

    this.user = user;

    await notice.validateFields(this);
    notice.addData(this);
    return notice;
  }
}
