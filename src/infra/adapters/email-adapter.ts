import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailData, EmailEnvSettingTypes } from '../../domain/notification-model';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class EmailAdapter {
  constructor() {}

  async sendEmail(inputData: EmailData): Promise<SentMessageInfo | null> {
    const transporter = this.createTransport(inputData.emailSettings);

    try {
      const info: SentMessageInfo = await this.sendMail(transporter, inputData);

      return info.messageId;
    } catch (error) {
      console.error(
        `Failed with ${inputData.subject.toLowerCase()} message sending `,
        error,
      );
    }
  }

  private async sendMail(
    transporter: SentMessageInfo,
    inputData: Omit<EmailData, 'emailSettings'>,
  ): Promise<SentMessageInfo> {
    return transporter.sendMail({
      from: inputData.from,
      sender: `Testing`,
      to: inputData.email,
      subject: inputData.subject,
      html: inputData.message,
    });
  }

  private createTransport(emailSettings: EmailEnvSettingTypes) {
    return nodemailer.createTransport({
      service: emailSettings.EMAIL_SERVICE,
      auth: {
        user: emailSettings.EMAIL_USER,
        pass: emailSettings.EMAIL_PASSWORD,
      },
    });
  }
}
