import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { OutputId } from '../../../../domain/likes.types';
import { getDeviceInfo } from '../../../../infra/utils/device-handler';
import {
  ErrorType,
  makeErrorsMessages,
} from '../../../../infra/utils/error-handler';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { handleErrors } from '../../../../infra/utils/interlay-error-handler.ts/interlay-errors.handler';
import { SessionCreationDto } from '../../../security/api/models/security-input.models/create-session.model';
import { DeleteActiveSessionCommand } from '../../../security/application/use-cases/commands/delete-active-session.command';
import { UpdateIssuedTokenCommand } from '../../../security/application/use-cases/commands/update-Issued-token.command';
import { AuthService } from '../../application/auth.service';
import { ConfirmEmailCommand } from '../../application/use-cases/commands/confirm-email.command';
import { CreateTemporaryAccountCommand } from '../../application/use-cases/commands/create-temp-account.command';
import { CreateUserCommand } from '../../application/use-cases/commands/create-user.command';
import { PasswordRecoveryCommand } from '../../application/use-cases/commands/recovery-password.command';
import { UpdateConfirmationCodeCommand } from '../../application/use-cases/commands/update-confirmation-code.command';
import { UpdatePassTempAccountCommand } from '../../application/use-cases/commands/update-password-temporary-account.command';
import { UpdatePasswordCommand } from '../../application/use-cases/commands/update-password.command';
import { GetClientInfo } from '../../infrastructure/decorators/client-ip.decorator';
import { CurrentUserInfo } from '../../infrastructure/decorators/current-user-info.decorator';
import { AccessTokenGuard } from '../../infrastructure/guards/accessToken.guard';
import { CustomThrottlerGuard } from '../../infrastructure/guards/custom-throttler.guard';
import { LocalAuthGuard } from '../../infrastructure/guards/local-auth.guard';
import { RefreshTokenGuard } from '../../infrastructure/guards/refreshToken.guard';
import { RegistrationEmailDto } from '../models/auth-input.models.ts/input-password-rec.type';
import { RecoveryPassDto } from '../models/auth-input.models.ts/input-recovery.model';
import { RegistrationCodeDto } from '../models/auth-input.models.ts/input-registration-code.model';
import { CreateUserDto } from '../models/auth-input.models.ts/input-registration.model';
import { UserInfoType } from '../models/auth-input.models.ts/user-info';
import { UserProfileType } from '../models/auth.output.models/auth.output.models';
import { AuthQueryRepository } from '../query-repositories/auth.query.repo';
import { CreateSessionCommand } from '../../../security/application/use-cases/commands/create-session.command';

type ClientInfo = {
  ip: string;
  userAgentInfo: any;
};

@Controller('auth')
export class AuthController {
  constructor(
    private authRepo: AuthQueryRepository,
    private authService: AuthService,
    private commandBus: CommandBus,
  ) {}

  @UseGuards(CustomThrottlerGuard, LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @CurrentUserInfo() userInfo: UserInfoType,
    @GetClientInfo() clientInfo: ClientInfo,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.getTokens(
      userInfo.userId,
    );

    const userPayload = this.authService.getUserPayloadByToken(refreshToken);

    if (!userPayload) throw new Error();

    const { browser, deviceType } = getDeviceInfo(clientInfo.userAgentInfo);

    const createSessionDto: SessionCreationDto = {
      userPayload,
      browser,
      deviceType,
      ipAddress: clientInfo.ip,
      userId: userInfo.userId,
      refreshToken,
    };

    const command = new CreateSessionCommand(createSessionDto);

    const result = await this.commandBus.execute<
      CreateSessionCommand,
      LayerNoticeInterceptor<OutputId>
    >(command);

    if (result.hasError()) {
      const errors = handleErrors(result.code, result.extensions);
      throw errors.error;
    }

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });

    return { accessToken };
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @CurrentUserInfo() userInfo: UserInfoType,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId, deviceId } = userInfo;

    const { accessToken, refreshToken } =
      await this.authService.updateUserTokens(userId, deviceId);

    const userInfoAfterRefresh =
      this.authService.getUserPayloadByToken(refreshToken);

    const issuedAt = new Date(userInfoAfterRefresh!.iat * 1000);
    const expirationDate = new Date(userInfoAfterRefresh!.exp * 1000);

    const command = new UpdateIssuedTokenCommand(
      deviceId,
      issuedAt,
      expirationDate,
    );

    await this.commandBus.execute<UpdateIssuedTokenCommand, boolean>(command);

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
    return { accessToken };
  }

  @UseGuards(CustomThrottlerGuard)
  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() data: RecoveryPassDto) {
    const existingAccount = await this.authRepo.findUserAccountByRecoveryCode(
      data.recoveryCode,
    );

    if (existingAccount) {
      const command = new UpdatePasswordCommand(data);

      return this.commandBus.execute<UpdatePasswordCommand, boolean>(command);
    }

    const command = new UpdatePassTempAccountCommand(data);

    return this.commandBus.execute(command);
  }

  @UseGuards(CustomThrottlerGuard)
  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() data: RegistrationEmailDto) {
    const userAccount = await this.authRepo.findByLoginOrEmail(data);

    if (!userAccount) {
      const command = new CreateTemporaryAccountCommand(data);

      await this.commandBus.execute<CreateTemporaryAccountCommand, OutputId>(
        command,
      );

      return;
    }

    const command = new PasswordRecoveryCommand(data);

    await this.commandBus.execute<PasswordRecoveryCommand, boolean>(command);
  }

  @Post('registration')
  @UseGuards(CustomThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(
    @Body() data: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { login, email } = data;

    const foundUser = await this.authRepo.findByLoginOrEmail({
      login,
      email,
    });

    if (foundUser) {
      let errors: ErrorType;

      if (foundUser.accountData.email === email) {
        errors = makeErrorsMessages('email');
      }

      if (foundUser.accountData.login === login) {
        errors = makeErrorsMessages('login');
      }

      res.status(HttpStatus.BAD_REQUEST).send(errors!);
      return;
    }

    const command = new CreateUserCommand(data);

    return this.commandBus.execute(command);
  }

  @UseGuards(CustomThrottlerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('registration-confirmation')
  async registrationConfirmation(
    @Body() data: RegistrationCodeDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const command = new ConfirmEmailCommand(data);

    const confirmedUser = await this.commandBus.execute<
      ConfirmEmailCommand,
      boolean
    >(command);

    if (!confirmedUser) {
      const errors = makeErrorsMessages('code');
      res.status(HttpStatus.BAD_REQUEST).send(errors);
    }
  }

  @UseGuards(CustomThrottlerGuard)
  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() data: RegistrationEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAccount = await this.authRepo.findByLoginOrEmail(data);

    if (
      !userAccount ||
      userAccount.emailConfirmation.isConfirmed ||
      new Date(userAccount.emailConfirmation.expirationDate) < new Date()
    ) {
      const errors = makeErrorsMessages('confirmation');
      res.status(HttpStatus.BAD_REQUEST).send(errors);
      return;
    }

    const command = new UpdateConfirmationCodeCommand(data);

    await this.commandBus.execute(command);
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  async getProfile(
    @CurrentUserInfo() userInfo: UserInfoType,
  ): Promise<UserProfileType> {
    const user = await this.authRepo.getUserById(userInfo.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { email, login, id } = user.accountData;

    return { email, login, userId: id };
  }

  @UseGuards(RefreshTokenGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUserInfo() userInfo: UserInfoType) {
    const command = new DeleteActiveSessionCommand(userInfo.deviceId);
    await this.commandBus.execute(command);
  }
}
