import Stripe from 'stripe';
import { BasePaymentOutput } from './base-payment.out.type';

export interface StripePaymentOutput extends BasePaymentOutput {
  session: Stripe.Checkout.Session;
}

export type OutputSessionUrlType = {
  url: string;
};
