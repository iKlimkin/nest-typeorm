import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  UserSessionDto,
  CurrentUserInfo,
  RefreshTokenGuard,
  SecurityInterface,
  SecurityViewDeviceModel,
  SecurityQueryRepo,
  DeleteActiveSessionCommand,
  DeleteOtherUserSessionsCommand,
} from './index';

@Controller('security/devices')
@UseGuards(RefreshTokenGuard)
export class SecurityController implements SecurityInterface {
  constructor(
    private securityQueryRepo: SecurityQueryRepo,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getUserActiveSessions(
    @CurrentUserInfo() userInfo: UserSessionDto,
  ): Promise<SecurityViewDeviceModel[]> {
    const { userId } = userInfo;

    const securityData = await this.securityQueryRepo.getUserActiveSessions(
      userId,
    );

    if (!securityData) {
      throw new UnauthorizedException();
    }

    return securityData;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateOtherUserSessions(
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const command = new DeleteOtherUserSessionsCommand(userInfo.deviceId);
    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateSpecificSession(
    @Param('id') deviceId: string,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const sessionExistence = await this.securityQueryRepo.getUserSession(
      deviceId,
    );

    if (!sessionExistence) {
      throw new NotFoundException('Session not found');
    }

    const sessions = await this.securityQueryRepo.getUserActiveSessions(
      userInfo.userId,
    );

    if (!sessions!.some((s) => s.deviceId === deviceId)) {
      throw new ForbiddenException('do not have permission');
    }

    const command = new DeleteActiveSessionCommand(userInfo);

    await this.commandBus.execute(command);
  }
}
