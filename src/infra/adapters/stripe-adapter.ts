import { Injectable } from '@nestjs/common';
import { ConfigurationType } from '../../settings/config/configuration';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Currency } from '../../features/integrations/payments/api/models/enums/currency-type';
import { ProductPlan } from '../../features/integrations/payments/api/models/enums/product-plans';
import { CreatePaymentDto } from '../../features/integrations/payments/api/models/input/create-payment.type';
import { IBlogSubscriptionPlanModelDto } from '../../features/integrations/payments/api/models/output/blog-subscription-plan.type';
import { HandlePaymentCommand } from '../../features/integrations/payments/application/use-cases/handle-payment-webhook.use-case';

export type StripeCreatedPaymentResponse =
  Stripe.Response<Stripe.Checkout.Session>;

@Injectable()
export class StripeAdapter {
  private readonly stripe: Stripe;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly webhookSecret: string;
  constructor(
    private readonly configService: ConfigService<ConfigurationType>,
  ) {
    const { api_key, success_url, cancel_url, webhook_secret } =
      this.configService.get('stripe', { infer: true });
    this.successUrl = success_url;
    this.cancelUrl = cancel_url;
    this.webhookSecret = webhook_secret;
    this.stripe = new Stripe(api_key);
  }

  createSubscriptionWithTrial = async (productId: string) => {
    // const product = await this.stripe.subscriptions.create({
    //   name: 'Premium Subscription with Trial',
    //   description: 'Premium subscription with a 7-day trial period',
    // });

    const trialPlan = await this.stripe.prices.create({
      unit_amount: 15 * 100 * 0.85,
      currency: Currency.USD,
      recurring: { trial_period_days: 7, interval: 'month' },
      product: productId,
      nickname: 'Premium Plan with 7-day Trial (15% Off)',
    });

    const subscriptionPlan: IBlogSubscriptionPlanModelDto = {
      id: trialPlan.id,
      name: trialPlan.nickname,
      amount: trialPlan.unit_amount / 100,
      currency: trialPlan.currency as Currency,
      subPlanType: ProductPlan.FirstPremiumMonthWithTrial,
      planData: trialPlan,
    };

    return subscriptionPlan;
  };

  createSubscriptionPlan = async (
    price: number,
    productId: string,
    description: string,
    interval: 'day' | 'month' | 'week' | 'year',
    currency = Currency.USD,
    discount = 0,
  ) =>
    this.stripe.prices.create({
      unit_amount: Math.round(price * 100 * (1 - discount)),
      currency,
      recurring: { interval },
      product: productId,
      nickname: description,
    });

  async createProductAndPlans(): Promise<IBlogSubscriptionPlanModelDto[]> {
    const product = await this.stripe.products.create({
      name: 'Blog Subscription',
      description: 'Subscription to access premium content on the blog',
    });

    const plansData = [
      {
        price: 5,
        description: 'Basic Plan first month (15% Off)',
        interval: 'month',
        subPlanType: ProductPlan.FirstBasicMonth,
        discount: 0.15,
      },
      {
        price: 15,
        description: 'Premium Plan first month (15% Off)',
        interval: 'month',
        subPlanType: ProductPlan.FirstPremiumMonth,
        discount: 0.15,
      },
      {
        price: 5,
        description: 'Basic Plan',
        interval: 'month',
        subPlanType: ProductPlan.Basic,
      },
      {
        price: 15,
        description: 'Monthly Plan',
        interval: 'month',
        subPlanType: ProductPlan.Monthly,
      },
      {
        price: 15 * 12,
        description: 'Yearly Plan (10% Off)',
        interval: 'year',
        subPlanType: ProductPlan.Yearly,
        discount: 0.1,
      },
    ];

    const subscriptionPlans: IBlogSubscriptionPlanModelDto[] = [];

    for (const {
      price,
      description,
      interval,
      subPlanType,
      discount,
    } of plansData) {
      const planData = await this.createSubscriptionPlan(
        price,
        product.id,
        description,
        interval as any,
        Currency.USD,
        discount,
      );
      subscriptionPlans.push({
        id: planData.id,
        name: planData.nickname,
        amount: planData.unit_amount / 100,
        currency: planData.currency as Currency,
        subPlanType,
        planData,
      });
    }

    const subWithTrialPeriod = await this.createSubscriptionWithTrial(
      product.id,
    );
    subscriptionPlans.push(subWithTrialPeriod);

    return subscriptionPlans;
  }

  createEvent(eventDto: HandlePaymentCommand): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        eventDto.rawBody,
        eventDto.signature,
        this.webhookSecret,
      );
    } catch (error) {
      console.error(
        `⚠️  Webhook signature verification failed.`,
        error.message,
      );
      return null;
    }
  }

  retrieveSessionWithCustomer = async (
    sessionId: string,
  ): Promise<{
    session: StripeCreatedPaymentResponse;
    customer: Stripe.Customer;
  }> => {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    const customer = (await this.stripe.customers.retrieve(
      session.customer as string,
    )) as Stripe.Customer;

    return {
      session,
      customer,
    };
  };

  async createPayment(
    paymentDto: CreatePaymentDto,
  ): Promise<StripeCreatedPaymentResponse> {
    try {
      return await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: paymentDto.planId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${this.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: this.cancelUrl,
        client_reference_id: paymentDto.userId,
      });
    } catch (error) {
      console.log(
        `something wrong has occurred during create stripe checkout session: ${error}`,
      );
      throw new Error(error);
    }
  }
}
