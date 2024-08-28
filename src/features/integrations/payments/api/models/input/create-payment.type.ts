import { PaymentSystemEnum } from '../enums/currency-type';

export type CreatePaymentInputType = {
  paymentSystem: PaymentSystemEnum;
  planId: string;
  userId: string;
};

export type CreatePaymentDto = Omit<CreatePaymentInputType, 'paymentSystem'>;
