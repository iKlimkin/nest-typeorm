import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../../../../domain/base-repository';
import { PaymentTransactionPlan } from '../domain/entities/payment-transaction-plan.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BlogSubscriptionPlanModel } from '../domain/entities/blog-subscription-plan-model.entity';

@Injectable()
export class PaymentsRepository extends BaseRepository {
  constructor(
    @InjectRepository(PaymentTransactionPlan)
    private readonly paymentTransactionsRepo: Repository<PaymentTransactionPlan>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    super();
  }

  async getPaymentBySessionId(sessionId: string) {
    try {
      return await this.paymentTransactionsRepo.findOne({
        where: { sessionId },
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getPaymentById(paymentTransactionId: string) {
    try {
      return await this.paymentTransactionsRepo.findOneBy({
        id: paymentTransactionId,
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async deletePayment(paymentTransactionId: string) {
    try {
      return await this.paymentTransactionsRepo.delete({
        id: paymentTransactionId,
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async getBlogPlanModel(productId: string) {
    try {
      return await this.dataSource
        .getRepository(BlogSubscriptionPlanModel)
        .findOne({ where: { productId } });
    } catch (error) {
      throw new Error(error);
    }
  }
}
