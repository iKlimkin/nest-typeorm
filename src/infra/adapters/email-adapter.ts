import { Injectable } from '@nestjs/common';
import nodemailer, { SentMessageInfo } from 'nodemailer';
import { EmailEnvSettingTypes } from '../application/managers/email-manager';

type InputEmailData = {
  emailSettings: any;
  from: string;
  subject: string;
  message: string;
  email: string;
};

@Injectable()
export class EmailAdapter {
  constructor() {}

  async sendEmail(inputData: InputEmailData): Promise<SentMessageInfo | null> {
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
    inputData: Omit<InputEmailData, 'emailSettings'>,
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
