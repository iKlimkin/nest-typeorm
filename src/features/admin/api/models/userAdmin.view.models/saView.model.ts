import { UsersResponseModel } from '../../../../auth/api/models/auth.output.models/auth-raw.output.models';
import { UserAccount } from '../../../domain/entities/user-account.entity';
import { SAViewType } from './userAdmin.view.model';

export const getSAViewSQLModel = (
  user: UsersResponseModel | UserAccount,
): SAViewType => ({
  id: user.id,
  login: user.login,
  email: user.email,
  createdAt: user.created_at.toISOString(),
});
