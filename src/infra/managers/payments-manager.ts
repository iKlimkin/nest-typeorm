import { Injectable } from '@nestjs/common';
import { StripeAdapter } from '../adapters/stripe-adapter';
import { PaymentSystemEnum } from '../../features/integrations/payments/api/models/enums/currency-type';
import {
  CreatePaymentDto,
  CreatePaymentInputType,
} from '../../features/integrations/payments/api/models/input/create-payment.type';
import { BasePaymentOutput } from '../../features/integrations/payments/api/models/output/base-payment.out.type';

interface IPaymentAdapter<TPayment extends BasePaymentOutput> {
  createPayment(paymentDto: CreatePaymentDto): Promise<TPayment>;
}

@Injectable()
export class PaymentsManager<TPayment> {
  adapters: Partial<Record<PaymentSystemEnum, IPaymentAdapter<any>>> = {};
  constructor(stripeAdapter: StripeAdapter) {
    this.adapters[PaymentSystemEnum.Stripe] = stripeAdapter;
  }

  createPayment(payment: CreatePaymentInputType): Promise<TPayment> {
    return this.adapters[payment.paymentSystem]?.createPayment({
      planId: payment.planId,
      userId: payment.userId,
    });
  }
}
