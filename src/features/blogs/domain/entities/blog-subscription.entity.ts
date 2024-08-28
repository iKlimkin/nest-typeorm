import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { SubscribeEnum } from '../../api/models/output.blog.models/blog.view.model-type';
import { Blog } from './blog.entity';

@Entity()
export class BlogNotifySubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserAccount, (user) => user.subscriptions)
  @JoinColumn()
  user: UserAccount;

  @Column()
  subscribeStatus: SubscribeEnum;

  @ManyToOne(() => Blog, (blog) => blog.notifySubscriptions)
  @JoinColumn()
  blog: Blog;

  static create(userId: string, blogId: string): BlogNotifySubscription {
    const subscription = new BlogNotifySubscription();
    subscription.user = { id: userId } as UserAccount;
    subscription.blog = { id: blogId } as Blog;
    subscription.subscribeStatus = SubscribeEnum.Subscribed;
    return subscription;
  }
  unsubscribe(): void {
    this.subscribeStatus = SubscribeEnum.Unsubscribed;
  }
  subscribe(): void {
    this.subscribeStatus = SubscribeEnum.Subscribed;
  }
}
