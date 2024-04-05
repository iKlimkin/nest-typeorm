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
import { UserSessionDto } from '../../auth/api/models/auth-input.models.ts/security-user-session-info';
import { CurrentUserInfo } from '../../auth/infrastructure/decorators/current-user-info.decorator';
import { RefreshTokenGuard } from '../../auth/infrastructure/guards/refreshToken.guard';
import { SecurityInterface } from './models/security-input.models/security.interface';
import { SecurityViewDeviceModel } from './models/security.view.models/security.view.types';
import { SecurityQueryRepo } from './query-repositories/security.query.repo';
import { SecurityInfoDto } from './models/security-input.models/security-info.model';
import { DeleteActiveSessionCommand } from '../application/use-cases/commands/delete-active-session.command';
import { DeleteOtherUserSessionsCommand } from '../application/use-cases/commands/delete-other-user-sessions.command';

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

    const securityData =
      await this.securityQueryRepo.getUserActiveSessions(userId);

    if (!securityData) {
      throw new UnauthorizedException();
    }

    return securityData;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateOtherUserSessions(@CurrentUserInfo() userInfo: UserSessionDto) {
    const command = new DeleteOtherUserSessionsCommand(userInfo.deviceId);
    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateSpecificSession(
    @Param('id') data: SecurityInfoDto,
    @CurrentUserInfo() userInfo: UserSessionDto,
  ) {
    const sessionExistence = await this.securityQueryRepo.getUserSession(
      data.deviceId,
    );

    if (!sessionExistence) {
      throw new NotFoundException('Session not found');
    }

    const sessions = await this.securityQueryRepo.getUserActiveSessions(
      userInfo.userId,
    );

    if (!sessions!.some((s) => s.deviceId === data.deviceId)) {
      throw new ForbiddenException('do not have permission');
    }

    const command = new DeleteActiveSessionCommand(data);

    await this.commandBus.execute(command);
  }
}
