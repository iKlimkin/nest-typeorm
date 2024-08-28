import { RouterPaths } from '../../../src/infra/utils/routing';

export class AuthUsersRouting {
  constructor(private readonly baseUrl = RouterPaths.auth) {}
  login = () => `${this.baseUrl}/login`;
  passwordRecovery = () => `${this.baseUrl}/password-recovery`;
  confirmPassword = () => `${this.baseUrl}/new-password`;
  refreshToken = () => `${this.baseUrl}/refresh-token`;
  registrationConfirmation = () => `${this.baseUrl}/registration-confirmation`;
  registration = () => `${this.baseUrl}/registration`;
  registrationEmailResending = () =>
    `${this.baseUrl}/registration-email-resending`;
  logout = () => `${this.baseUrl}/logout`;
  me = () => `${this.baseUrl}/me`;
}
