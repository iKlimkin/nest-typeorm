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
import { ObjectIdPipe } from '../../../infra/pipes/valid-objectId.pipe';
import { UserInfoType } from '../../auth/api/models/auth-input.models.ts/user-info';
import { CurrentUserInfo } from '../../auth/infrastructure/decorators/current-user-info.decorator';
import { RefreshTokenGuard } from '../../auth/infrastructure/guards/refreshToken.guard';
import { DeleteActiveSessionSqlCommand } from '../application/use-cases/commands/delete-active-session-sql.command';
import { DeleteOtherUserSessionsSqlCommand } from '../application/use-cases/commands/delete-other-user-sessions-sql.command';
import { SecurityInterface } from './models/security-input.models/security.interface';
import { SecurityViewDeviceModel } from './models/security.view.models/security.view.types';
import { ApiRequestCounterSQLRepository } from '../../../infra/logging/infra/api-request-counter.sql-repository';
import { SecuritySqlQueryRepo } from './query-repositories/security.query.sql-repo';
import { SecurityTORQueryRepo } from './query-repositories/security.query.repo';

@Controller('security/devices')
@UseGuards(RefreshTokenGuard)
export class SecuritySqlController implements SecurityInterface {
  constructor(
    private securitySqlQueryRepo: SecuritySqlQueryRepo,
    private securityRepo: SecurityTORQueryRepo,
    private apiRequestCounterSqlRepository: ApiRequestCounterSQLRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getUserActiveSessions(
    @CurrentUserInfo() userInfo: UserInfoType,
  ): Promise<SecurityViewDeviceModel[]> {
    const { userId } = userInfo;

    const securityData = await this.securityRepo.getUserActiveSessions(userId);

    if (!securityData) {
      throw new UnauthorizedException('have no active sessions');
    }

    return securityData;
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateOtherUserSessions(@CurrentUserInfo() userInfo: UserInfoType) {
    const command = new DeleteOtherUserSessionsSqlCommand(userInfo.deviceId);
    await this.commandBus.execute(command);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateSpecificSession(
    @Param('id', ObjectIdPipe) deviceId: string,
    @CurrentUserInfo() userInfo: UserInfoType,
  ) {
    const sessionExistence = await this.securityRepo.getUserSession(deviceId);

    if (!sessionExistence) {
      throw new NotFoundException('Session not found');
    }

    const sessions = await this.securityRepo.getUserActiveSessions(
      userInfo.userId,
    );

    if (!sessions!.some((s) => s.deviceId === deviceId)) {
      throw new ForbiddenException('do not have permission');
    }

    const command = new DeleteActiveSessionSqlCommand(deviceId);

    await this.commandBus.execute(command);
  }

  @Get('requestLogs')
  @HttpCode(HttpStatus.NO_CONTENT)
  async getRequestApiLogs() {
    return this.apiRequestCounterSqlRepository.getApiRequestLoggerSql();
  }
}
