import { add } from 'date-fns';
import { UserRecoveryType } from '../../api/models/auth.output.models/auth.output.models';
import { v4 as uuidv4 } from 'uuid';

export const createRecoveryCode = (): UserRecoveryType => ({
  recoveryCode: uuidv4(),
  expirationDate: add(new Date(), { minutes: 45 }),
});
