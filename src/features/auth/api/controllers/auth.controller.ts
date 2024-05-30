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
import {
  AccessTokenGuard,
  AuthQueryRepository,
  AuthService,
  ClientInfo,
  ConfirmEmailCommand,
  CreateSessionCommand,
  CreateTemporaryAccountCommand,
  CreateUserCommand,
  CreateUserDto,
  CurrentUserInfo,
  CustomThrottlerGuard,
  DeleteActiveSessionCommand,
  ErrorType,
  GetClientInfo,
  LayerNoticeInterceptor,
  LocalAuthGuard,
  OutputId,
  PasswordRecoveryCommand,
  RecoveryPassDto,
  RefreshTokenGuard,
  RegistrationCodeDto,
  RegistrationEmailDto,
  SessionCreationDto,
  UpdateConfirmationCodeCommand,
  UpdateIssuedTokenCommand,
  UpdatePassTempAccountCommand,
  UpdatePasswordCommand,
  UserProfileType,
  UserSessionDto,
  getDeviceInfo,
  handleErrors,
  makeErrorsMessages,
} from '.';

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
    @CurrentUserInfo() userInfo: UserSessionDto,
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

    if (result.hasError) {
      const errors = handleErrors(result.code, result.extensions[0]);
      throw errors.error;
    }

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });

    return { accessToken };
  }

  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @CurrentUserInfo() userInfo: UserSessionDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { userId, deviceId } = userInfo;

    const { accessToken, refreshToken } =
      await this.authService.updateUserTokens(userId, deviceId);

    const userInfoAfterRefresh =
      this.authService.getUserPayloadByToken(refreshToken);

    const issuedAt = new Date(userInfoAfterRefresh!.iat * 1000);
    const expirationDate = new Date(userInfoAfterRefresh!.exp * 1000);

    const command = new UpdateIssuedTokenCommand({
      deviceId,
      issuedAt,
      expirationDate,
    });

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
    @CurrentUserInfo() userInfo: UserSessionDto,
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
  async logout(@CurrentUserInfo() userInfo: UserSessionDto) {
    const command = new DeleteActiveSessionCommand(userInfo);
    await this.commandBus.execute(command);
  }
}
