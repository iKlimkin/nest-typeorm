import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../../domain/base-entity';
import { convertToCents } from '../../../../../infra/utils/convert-to-cents.util';
import { Blog } from '../../../../blogs/domain/entities/blog.entity';
import { Currency } from '../../api/models/enums/currency-type';
import { ProductPlan } from '../../api/models/enums/product-plans';
import { ICreateBlogSubPlanModelDto } from '../../api/models/output/blog-subscription-plan.type';
import { MembershipBlogPlan } from './membership-blog-plan.entity';

@Entity()
export class BlogSubscriptionPlanModel extends BaseEntity {
  @Column()
  productId: string;

  @ManyToOne(() => Blog, (blog) => blog.subscriptionPlanModels)
  @JoinColumn({ name: 'blogId' })
  blog: Blog;
  @Column('uuid')
  blogId: string;

  @Column()
  productTitle: string;

  @Column()
  productPlan: ProductPlan;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  productPriceInCents: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  productPrice: number;

  @Column('jsonb')
  productData: Record<string, any>;

  @Column()
  productCurrency: Currency;

  @OneToMany(
    () => MembershipBlogPlan,
    (membershipPlan) => membershipPlan.blogPlanModel,
    { nullable: true },
  )
  membershipPlans: MembershipBlogPlan[];

  static create(planDto: ICreateBlogSubPlanModelDto) {
    const { amount, currency, id, name, planData, subPlanType, blogId } =
      planDto;
    const newPlan = new BlogSubscriptionPlanModel();

    let priceInCents = convertToCents(amount, currency);
    newPlan.productId = id;
    newPlan.productPrice = amount; // in USD
    newPlan.blog = { id: blogId } as Blog;
    newPlan.productTitle = name;
    newPlan.productPlan = subPlanType;
    newPlan.productPriceInCents = priceInCents;
    newPlan.productData = planData;
    newPlan.productCurrency = currency;

    return newPlan;
  }
}
