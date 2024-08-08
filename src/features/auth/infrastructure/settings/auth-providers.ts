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
  BanUnbanUserUseCase,
  SACrudApiService,
} from '.';
import { BloggerCrudApiService } from '../../../admin/application/bloggerCrudApi.service';
import { FileDimensionsValidationPipe } from '../../../blogs/infrastructure/pipes/file-dimensions-validation.pipe';
import { BlogsQueryRepo } from '../../../blogs/api/query-repositories/blogs.query.repo';

export const usersProviders: Provider[] = [
  UsersRepository,
  UsersQueryRepo,
  AuthRepository,
  AuthQueryRepository,
  SACrudApiService,
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
  BanUnbanUserUseCase,
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
  BloggerCrudApiService,
  BlogsQueryRepo,
  AuthService,
  ...usersProviders,
  FileDimensionsValidationPipe,
];
