import { Length, Matches } from 'class-validator';
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
  descriptionLength,
  nameLength,
  urlLength,
  urlMatching,
} from '../../../../domain/validation.constants';
import { iSValidField } from '../../../../infra/decorators/transform/transform-params';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import type { Post } from '../../../posts/domain/entities/post.entity';
import {
  BlogCreationDto,
  UpdateBlogDto,
} from '../../api/models/dtos/blog-dto.model';
import type { UserBloggerBans } from './user-blogger-bans.entity';
import { BlogImage } from '../../../files/domain/entities/blog-images.entity';
import { Subscription } from './blog-subscription.entity';

@Entity()
export class Blog extends BaseEntity {
  // @Index('title', { unique: true })
  @iSValidField(nameLength)
  @Column({ collation: 'C' })
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

  @ManyToOne('UserAccount', 'blogs', {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  user: UserAccount;

  @OneToMany('UserBloggerBans', 'blog')
  bloggerBans: UserBloggerBans[];

  @OneToMany('Post', 'blog')
  posts: Post[];

  @Column({ default: false })
  isBanned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  banDate: Date;

  @OneToOne(() => BlogImage, (images) => images.blog)
  images: BlogImage;

  @OneToMany(() => Subscription, (subs) => subs.blog)
  subscriptions: Subscription[];

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

  banUnban(isBanned: boolean) {
    this.isBanned = isBanned;
    this.banDate = isBanned ? new Date() : null;
  }
}
