import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigurationType } from '../../settings/config/configuration';
import { EmailAdapter } from '../adapters/email-adapter';

export type EmailEnvSettingTypes = {
  EMAIL_PASSWORD: string;
  EMAIL_USER: string;
  EMAIL_SERVICE: string;
};

@Injectable()
export class EmailManager {
  constructor(
    private emailAdapter: EmailAdapter,
    private readonly configService: ConfigService<ConfigurationType>,
  ) {}
  async sendEmailRecoveryMessage(
    email: string,
    recoveryCode: string,
  ): Promise<string> {
    const recoveryLink = `https://somesite.com/password-recovery?recoveryCode=${recoveryCode}`;
    const emailSettings = this.getEmailSettings();

    const passwordRecoveryData = {
      emailSettings,
      from: `Interact Hub👻`,
      subject: 'Password recovery',
      message: `,
      <p>To finish password recovery please follow the link below:
      <a href='${recoveryLink}'>recovery password</a>
      </p>`,
      email,
    };

    return this.emailAdapter.sendEmail(passwordRecoveryData);
  }

  async sendEmailConfirmationMessage(
    email: string,
    confirmationCode: string,
  ): Promise<string> {
    const confirmationLink = `https://somesite.com/confirm-email?code=${confirmationCode}`;
    const emailSettings = this.getEmailSettings();

    const confirmationData = {
      emailSettings,
      from: `Social Hub👻 <${emailSettings?.EMAIL_USER}>`,
      subject: 'Email Confirmation',
      message: `<h1>Thank for your registration</h1>
    <p>To finish registration please follow the link below:
        <a href=${confirmationLink}>complete registration</a>
    </p>`,
      email,
    };

    return this.emailAdapter.sendEmail(confirmationData);
  }

  private getEmailSettings(): EmailEnvSettingTypes {
    return this.configService.get('emailSetting', {
      infer: true,
    })!;
  }
}
