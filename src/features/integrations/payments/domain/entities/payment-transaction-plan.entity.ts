import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../../../domain/base-entity';
import { UserAccount } from '../../../../admin/domain/entities/user-account.entity';
import {
  Currency,
  PaymentSystemEnum,
} from '../../api/models/enums/currency-type';
import { MembershipBlogPlan } from './membership-blog-plan.entity';

@Entity()
export class PaymentTransactionPlan extends BaseEntity {
  @Column()
  paymentSystem: PaymentSystemEnum;

  @OneToOne(() => MembershipBlogPlan, { nullable: true })
  @JoinColumn()
  membershipPlan: MembershipBlogPlan;

  @Column()
  productId: string;

  @ManyToOne(() => UserAccount, (user) => user.paymentTransactions)
  @JoinColumn()
  user: UserAccount;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  price: number;

  @Column()
  paymentStatus: PaymentStatus;

  @Column()
  sessionId: string;

  @Column()
  currency: Currency;

  @Column('jsonb')
  paymentProviderInfo: Record<string, any>;

  @Column('jsonb', { nullable: true })
  paymentCheckoutInfo: Record<string, any>;

  static create(paymentData: CreatePaymentTransactionPlanDto) {
    const {
      paymentSystem,
      userId,
      price,
      paymentProviderInfo,
      productId,
      currency,
    } = paymentData;
    const payment = new PaymentTransactionPlan();
    payment.paymentSystem = paymentSystem;
    payment.price = price;
    payment.paymentStatus = PaymentStatus.PENDING;
    payment.paymentProviderInfo = paymentProviderInfo;
    payment.sessionId = paymentProviderInfo.id;
    payment.user = { id: userId } as UserAccount;
    payment.productId = productId;
    payment.membershipPlan;
    payment.currency = currency;

    return payment;
  }

  completePaymentTransaction = (paymentDto: CompletePaymentType) => {
    const { membershipPlanId, paymentStatus } = paymentDto;
    this.addMembershipPlan(membershipPlanId);
    // this.addPaymentCheckoutInfo(paymentCheckoutInfo);
    this.changePaymentStatus(paymentStatus);
  };

  addMembershipPlan = (membershipPlanId: string) => {
    this.membershipPlan = { id: membershipPlanId } as MembershipBlogPlan;
  };
  changePaymentStatus = (paymentStatus: PaymentStatus) => {
    this.paymentStatus = paymentStatus;
  };
  addPaymentCheckoutInfo = (paymentCheckoutInfo: Record<string, any>) => {
    this.paymentCheckoutInfo = paymentCheckoutInfo;
  };
}

type CompletePaymentType = {
  membershipPlanId: string;
  // paymentCheckoutInfo: Record<string, any>;
  paymentStatus: PaymentStatus;
};

export type CreatePaymentTransactionPlanDto = {
  paymentSystem: PaymentSystemEnum;
  productId: string;
  userId: string;
  price: number;
  paymentProviderInfo: Record<string, any>;
  currency: Currency;
};

export enum PaymentStatus {
  PENDING = 'pending',
  NO_PAYMENT_REQUIRED = 'no_payment_required',
  UNPAID = 'unpaid',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  REQUIRES_ACTION = 'requires_action',
}
