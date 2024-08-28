import { Length, Matches } from 'class-validator';
import {
  Column,
  Entity,
  Index,
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
import { BlogImage } from '../../../files/domain/entities/blog-images.entity';
import type { Post } from '../../../posts/domain/entities/post.entity';
import { UpdateBlogDto } from '../../api/models/dtos/blog-dto.model';
import { BlogNotifySubscription } from './blog-subscription.entity';
import type { UserBloggerBans } from './user-blogger-bans.entity';
import { CreateBlogCommandDto } from '../../api/models/input.blog.models/create.blog.model';
import { MembershipBlogPlan } from '../../../integrations/payments/domain/entities/membership-blog-plan.entity';
import { BlogSubscriptionPlanModel } from '../../../integrations/payments/domain/entities/blog-subscription-plan-model.entity';

@Entity()
export class Blog extends BaseEntity {
  @Index('title')
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

  @ManyToOne('UserAccount', 'blogs', {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ownerId' })
  user: UserAccount;

  @Column('boolean', { default: false })
  isMembership: boolean;

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

  @OneToMany(() => BlogNotifySubscription, (notifySub) => notifySub.blog)
  notifySubscriptions: BlogNotifySubscription[];

  @OneToMany(() => MembershipBlogPlan, (membershipPlan) => membershipPlan.blog)
  membershipPlans: MembershipBlogPlan[];

  @OneToMany(
    () => BlogSubscriptionPlanModel,
    (subscriptionPlanModels) => subscriptionPlanModels.blog,
  )
  subscriptionPlanModels: BlogSubscriptionPlanModel[];

  static async create(createBlogDto: CreateBlogCommandDto) {
    const notice = new LayerNoticeInterceptor<Blog>();
    const { description, name, websiteUrl, userId } = createBlogDto;

    const newBlog = new Blog();
    newBlog.title = name;
    newBlog.description = description;
    newBlog.websiteUrl = websiteUrl;
    newBlog.user = { id: userId } as UserAccount;

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
