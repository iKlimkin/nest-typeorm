import { Provider } from '@nestjs/common';
import {
  AccessTokenStrategy,
  AuthQueryRepository,
  AuthRepository,
  AuthService,
  BcryptAdapter,
  ConfirmEmailUseCase,
  CreateSAUseCase,
  CreateTemporaryAccountUseCase,
  CreateUserAccountEventHandler,
  CreateUserSessionUseCase,
  CreateUserUseCase,
  DeleteActiveSessionUseCase,
  DeleteOtherUserSessionsUseCase,
  DeleteSAUseCase,
  EmailAdapter,
  EmailManager,
  LocalStrategy,
  RecoveryPasswordUseCase,
  RefreshTokenStrategy,
  SecurityQueryRepo,
  SecurityRepository,
  SendRecoveryMsgUseCase,
  UpdateConfirmationCodeUseCase,
  UpdateIssuedTokenUseCase,
  UpdatePasswordTemporaryAccountUseCase,
  UpdatePasswordUseCase,
  UserCreatedNoticeEventHandler,
  UsersQueryRepo,
  UsersRepository,
  VerificationCredentialsUseCase,
  BasicSAStrategy,
} from '.';

export const usersProviders: Provider[] = [
  UsersRepository,
  UsersQueryRepo,
  AuthRepository,
  AuthQueryRepository,
];

export const strategies: Provider[] = [
  AccessTokenStrategy,
  RefreshTokenStrategy,
  LocalStrategy,
  BasicSAStrategy,
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
];

const quizProviders = [
  // QuizQueryRepo
];

export const securityUseCases: Provider[] = [
  DeleteActiveSessionUseCase,
  DeleteOtherUserSessionsUseCase,
];

export const authEventHandlers: Provider[] = [
  UserCreatedNoticeEventHandler,
  CreateUserAccountEventHandler,
];

export const adapters: Provider[] = [BcryptAdapter, EmailManager, EmailAdapter];

export const providers = [
  ...strategies,
  ...authUseCases,
  ...adapters,
  ...authEventHandlers,
  ...securityProviders,
  ...securityUseCases,
  AuthService,
  ...usersProviders,
  ...quizProviders,
];
