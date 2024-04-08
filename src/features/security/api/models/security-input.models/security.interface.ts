import { UserSessionDto } from '../../../../auth/api/models/auth-input.models.ts/security-user-session-info';
import { SecurityViewDeviceModel } from '../security.view.models/security.view.types';
import { SecurityInfoDto } from './security-info.model';

export interface SecurityInterface {
  getUserActiveSessions(
    userInfo: UserSessionDto,
  ): Promise<SecurityViewDeviceModel[]>;
  terminateOtherUserSessions(userInfo: UserSessionDto): Promise<void>;
  terminateSpecificSession(
    data: SecurityInfoDto,
    userInfo: UserSessionDto,
  ): Promise<void>;
}
