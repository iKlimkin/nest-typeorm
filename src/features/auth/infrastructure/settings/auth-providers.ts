import { Provider } from '@nestjs/common';
import { AuthService } from '../../application/auth.service';
import { UsersRepo } from '../../../admin/infrastructure/users.repo';
import { UsersQueryRepo } from '../../../admin/infrastructure/users.query.repo';
import { CreateSAUseCase } from '../../../admin/application/use-cases/create-sa.use.case';
import { BcryptAdapter } from '../../../../infra/adapters/bcrypt-adapter';
import { EmailAdapter } from '../../../../infra/adapters/email-adapter';
import { EmailManager } from '../../../../infra/managers/email-manager';
import { AuthRepository } from '../auth.repository';
import { SecurityQueryRepo } from '../../../security/api/query-repositories/security.query.repo';
import { SecurityRepository } from '../../../security/infrastructure/security.repository';
import { VerificationCredentialsUseCase } from '../../application/use-cases/verification-credentials.use-case';
import { AuthQueryRepository } from '../../api/query-repositories/auth.query.repo';
import { CreateUserSessionUseCase } from '../../../security/application/use-cases/create-user-session.use-case';
import { CreateTemporaryAccountUseCase } from '../../application/use-cases/create-temporary-account.use-case';
import { SendRecoveryMsgUseCase } from '../../application/use-cases/send-recovery-msg.use-case';
import { UpdateIssuedTokenUseCase } from '../../application/use-cases/update-issued-token.use-case';
import { UpdatePasswordUseCase } from '../../application/use-cases/update-password.use-case';
import { UpdatePasswordTemporaryAccountUseCase } from '../../application/use-cases/update-password-temporary-account.use-case';
import { RecoveryPasswordUseCase } from '../../application/use-cases/recovery-password.use-case';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { ConfirmEmailUseCase } from '../../application/use-cases/confirm-email.use-case';
import { UpdateConfirmationCodeUseCase } from '../../application/use-cases/update-confirmation-code.use-case';
import { DeleteActiveSessionUseCase } from '../../../security/application/use-cases/delete-active-session.use-case';
import { UserCreatedNoticeEventHandler } from '../../application/use-cases/events/handlers/user-created-notification.event-handler';
import { CreateUserAccountEventHandler } from '../../application/use-cases/events/handlers/create-user-account.event-handler';
import { LocalStrategy } from '../guards/strategies/local-strategy';
import {
  AccessTokenStrategy,
  RefreshTokenStrategy,
} from '../guards/strategies/jwt-strategy';
import { DeleteSAUseCase } from '../../../admin/application/use-cases/delete-sa.use.case';
import { DeleteOtherUserSessionsUseCase } from '../../../security/application/use-cases/delete-other-user-sessions.use-case';

export const usersProviders: Provider[] = [
  UsersRepo,
  UsersQueryRepo,
  AuthRepository,
  AuthQueryRepository,
];

export const Strategies: Provider[] = [
  AccessTokenStrategy,
  RefreshTokenStrategy,
  LocalStrategy,
];

export const securityProviders: Provider[] = [
  SecurityQueryRepo,
  SecurityRepository,
];

export const authUseCases: Provider[] = [
  DeleteSAUseCase,
  CreateSAUseCase,
  CreateUserUseCase,
  VerificationCredentialsUseCase,
  SendRecoveryMsgUseCase,
  CreateUserSessionUseCase,
  CreateTemporaryAccountUseCase,
  UpdateIssuedTokenUseCase,
  UpdatePasswordUseCase,
  UpdatePasswordTemporaryAccountUseCase,
  RecoveryPasswordUseCase,
  ConfirmEmailUseCase,
  UpdateConfirmationCodeUseCase,
  DeleteActiveSessionUseCase,
  DeleteOtherUserSessionsUseCase,
];

export const securityUseCases: Provider[] = [];

export const authEventHandlers: Provider[] = [
  UserCreatedNoticeEventHandler,
  CreateUserAccountEventHandler,
];

export const adapters: Provider[] = [BcryptAdapter, EmailManager, EmailAdapter];

export const authProviders = [
  ...Strategies,
  ...adapters,
  ...authEventHandlers,
  ...securityProviders,
  ...securityUseCases,
  AuthService,
  ...usersProviders,
];
