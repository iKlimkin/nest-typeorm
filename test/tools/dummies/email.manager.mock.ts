// export const EmailServiceMockObject = {
//   sendEmailConfirmationMessage: jest.fn().mockImplementation(async () => {
//     console.log('Call mock method sendPasswordRecoveryMail / MailService');
//     return true;
//   }),
//   sendEmailRecoveryMessage: jest.fn().mockImplementation(async () => {
//     console.log('Call mock method sendPasswordRecoveryMail / MailService');
//     return true;
//   }),
// };

import { EmailManager } from '../../../src/features/auth/infrastructure/settings';

export class EmailManagerMock {
  async sendEmailConfirmationMessage(): Promise<void> {
    await Promise.resolve();
  }
  async sendEmailRecoveryMessage(): Promise<void> {
    await Promise.resolve();
  }
}

export class EmailMockService extends EmailManager {
  sendEmailConfirmationMessage(
    email: string,
    confirmationCode: string
  ): Promise<any> {
    return Promise.resolve({ confirmationCode, email });
  }

  sendEmailRecoveryMessage(email: string, recoveryCode: string): Promise<any> {
    return Promise.resolve(recoveryCode);
  }
}

export class EmailAdapterMock {
  sendEmail = jest.fn().mockResolvedValue({});
}
