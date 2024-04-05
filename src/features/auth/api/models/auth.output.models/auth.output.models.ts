import { SAViewType } from '../../../../admin/api/models/userAdmin.view.models/userAdmin.view.model';

export type UserType = {
  login: string;
  email: string;
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
};

export type UserProfileType = Pick<UserType, 'login' | 'email'> & {
  userId: string;
};

export type UserRecoveryType = {
  recoveryCode: string;
  expirationDate: Date;
};

export type UserAccountType = {
  accountData: UserType;
  emailConfirmation: UserConfirmationType;
  passwordRecovery: UserRecoveryType;
};

export type UserAccountViewModel = {
  accountData: SAViewType;
  emailConfirmation: UserConfirmationType;
};

export type UserConfirmationType = {
  confirmationCode: string;
  expirationDate: string;
  isConfirmed: boolean;
};
