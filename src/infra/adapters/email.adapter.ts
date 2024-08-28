import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailData } from '../../domain/notification-model';
import { SentMessageInfo } from 'nodemailer';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { ConfigurationType } from '../../settings/config/configuration';

@Injectable()
export class EmailAdapter {
  private readonly emailSettings: ConfigurationType['emailSettings'];
  constructor(
    private readonly configService: ConfigService<ConfigurationType>,
  ) {
    this.emailSettings = this.configService.get('emailSettings', {
      infer: true,
    });
  }

  async sendEmail(sendEmailData: EmailData): Promise<SentMessageInfo | null> {
    const transporter = this.createTransport();

    try {
      const info: SentMessageInfo = await this.sendMail(
        transporter,
        sendEmailData,
      );

      return info.messageId;
    } catch (error) {
      console.error(
        `Failed with ${sendEmailData.subject.toLowerCase()} message sending `,
        error,
      );
    }
  }

  private async sendMail(
    transporter: SentMessageInfo,
    sendEmailData: Omit<EmailData, 'emailSettings'>,
  ): Promise<SentMessageInfo> {
    return transporter.sendMail({
      from: sendEmailData.from,
      sender: `Testing`,
      to: sendEmailData.to,
      subject: sendEmailData.subject,
      html: sendEmailData.message,
    });
  }

  private createTransport() {
    const { EMAIL_PASSWORD, EMAIL_SERVICE, EMAIL_USER } = this.emailSettings;
    return nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }
}
