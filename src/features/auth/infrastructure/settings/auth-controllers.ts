import { BloggerUsersController } from '../../../admin/api/controllers/blogger-users.controller';
import { SAController } from '../../../admin/api/controllers/sa.controller';
import { SecurityController } from '../../../security/api/security.controller';
import { AuthController } from '../../api/controllers/auth.controller';

export const authControllers = [
  AuthController,
  SecurityController,
  SAController,
  BloggerUsersController,
];

export const controllers = [...authControllers];
