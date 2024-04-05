import { SAController } from '../../../admin/api/controllers/sa.controller';
import { SecurityController } from '../../../security/api/security.controller';
import { AuthController } from '../../api/controllers/auth.controller';

export const authControllers = [
  AuthController,
  SecurityController,
  SAController,
];

export const controllers = [
  ...authControllers
];
