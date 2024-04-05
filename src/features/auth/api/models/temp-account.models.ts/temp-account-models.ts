import { UserRecoveryType } from '../auth.output.models/auth.output.models';

export type CreateTempAccountDto = UserRecoveryType & {
  email: string;
};
