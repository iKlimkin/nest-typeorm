import { Injectable } from '@nestjs/common';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PaymentsRepository } from '../infrastructure/payments.repository';
import { PaymentStatus } from '../domain/entities/payment-transaction-plan.entity';

@Injectable()
export class PaymentsScheduleService {
  constructor(
    private readonly scheduleRegistry: SchedulerRegistry,
    private paymentsRepository: PaymentsRepository,
  ) {}

  private async clearPayments(paymentTransactionId: string) {
    const payment = await this.paymentsRepository.getPaymentById(
      paymentTransactionId,
    );
    if (payment.paymentStatus === PaymentStatus.PENDING) {
      await this.paymentsRepository.deletePayment(payment.id);
    }
  }

  async addJob(paymentTransactionId: string) {
    const { job, jobKey } = this.getJob(paymentTransactionId);

    if (!job) {
      const job = new CronJob(CronExpression.EVERY_10_HOURS, async () => {
        await this.clearPayments(paymentTransactionId);
      });

      this.scheduleRegistry.addCronJob(jobKey, job);
      job.start();
    }
  }
  removeJob(paymentTransactionId: string) {
    const { job, jobKey } = this.getJob(paymentTransactionId);
    if (job) {
      job.stop();
      this.scheduleRegistry.deleteCronJob(jobKey);
    }
  }

  private getJob(paymentTransactionId: string) {
    const jobKey = `paymentTransactionId-${paymentTransactionId}${new Date().getTime()}`;
    try {
      const job = this.scheduleRegistry.getCronJob(jobKey);
      return { job, jobKey };
    } catch (error) {
      return { jobKey, job: null };
    }
  }
}
