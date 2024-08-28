import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../../../domain/base-entity';
import { UserAccount } from '../../../../admin/domain/entities/user-account.entity';
import { Blog } from '../../../../blogs/domain/entities/blog.entity';
import { PaymentTransactionPlan } from './payment-transaction-plan.entity';
import { BlogSubscriptionPlanModel } from './blog-subscription-plan-model.entity';
import { ProductPlan } from '../../api/models/enums/product-plans';

@Entity()
export class MembershipBlogPlan extends BaseEntity {
  @ManyToOne(() => Blog, (blog) => blog.membershipPlans)
  @JoinColumn()
  blog: Blog;

  @ManyToOne(() => UserAccount, (user) => user.membershipPlans)
  @JoinColumn()
  user: UserAccount;

  @ManyToOne(
    () => BlogSubscriptionPlanModel,
    (blogPlanModel) => blogPlanModel.membershipPlans,
  )
  @JoinColumn()
  blogPlanModel: BlogSubscriptionPlanModel;

  @OneToOne(() => PaymentTransactionPlan)
  paymentTransaction: PaymentTransactionPlan;

  @Column({ type: 'timestamp' })
  subscribedAt: Date;

  @Column({ type: 'boolean' })
  isActive: boolean;

  @Column('date')
  endDate: Date;

  // @Column()
  // monthCount: number;

  static create(membershipPlanDto: IBlogMembershipPlan) {
    const { blogId, userId, planId, planType } = membershipPlanDto;
    const planMonthCounts = convertSubscriptionEndDate(planType);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + planMonthCounts);

    const newMembershipPlan = new MembershipBlogPlan();

    newMembershipPlan.blog = { id: blogId } as Blog;
    newMembershipPlan.user = { id: userId } as UserAccount;
    newMembershipPlan.blogPlanModel = {
      id: planId,
    } as BlogSubscriptionPlanModel;
    newMembershipPlan.subscribedAt = new Date();
    newMembershipPlan.endDate = endDate;
    newMembershipPlan.isActive = true;

    return newMembershipPlan;
  }

  setSubscriptionDuration(productPlan: ProductPlan) {
    this.subscribedAt = new Date();
    const planMonthCounts = this.convertSubscriptionEndDate(productPlan);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + planMonthCounts);
    this.endDate = endDate;
  }

  setSubscriptionStatus(status: boolean) {
    this.isActive = status;
  }

  private convertSubscriptionEndDate(productPlan: ProductPlan) {
    return productPlan !== ProductPlan.Yearly ? 1 : 12;
  }
}

export const convertSubscriptionEndDate = (productPlan: ProductPlan) =>
  productPlan !== ProductPlan.Yearly ? 1 : 12;

export interface IBlogMembershipPlan {
  blogId: string;
  userId: string;
  planId: string;
  planType: ProductPlan;
}
