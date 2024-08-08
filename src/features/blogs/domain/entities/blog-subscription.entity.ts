import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { Blog } from './blog.entity';
import { SubscribeEnum } from '../../api/models/output.blog.models/blog.view.model-type';

@Entity()
export class Subscription extends BaseEntity {
  @ManyToOne(() => UserAccount, (user) => user.subscriptions)
  user: UserAccount;

  @Column()
  subscribeStatus: SubscribeEnum;

  @ManyToOne(() => Blog, (blog) => blog.subscriptions)
  blog: Blog;

  static create(userId: string, blogId: string): Subscription {
    const subscription = new Subscription();
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
