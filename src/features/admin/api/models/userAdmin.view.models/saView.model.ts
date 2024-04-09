import { UserAccount } from '../../../domain/entities/user-account.entity';
import { SAViewType } from './userAdmin.view.model';

export const getSAViewModel = (user: UserAccount): SAViewType => ({
  id: user.id,
  login: user.login,
  email: user.email,
  createdAt: user.created_at.toISOString(),
});
