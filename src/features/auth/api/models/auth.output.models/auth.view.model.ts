import { UserAccount } from '../../../../admin/domain/entities/user-account.entity';
import { UserAccountViewModel } from './auth.output.models';

export const getUserAccountViewModel = (
  user: UserAccount,
): UserAccountViewModel => ({
  accountData: {
    id: user.id,
    login: user.login,
    email: user.email,
    createdAt: user.created_at.toISOString(),
  },
  emailConfirmation: {
    confirmationCode: user.confirmation_code,
    expirationDate: user.confirmation_expiration_date.toISOString(),
    isConfirmed: user.is_confirmed,
  },
});
