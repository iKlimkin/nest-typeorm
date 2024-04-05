import { UserInfoType } from '../../../../auth/api/models/auth-input.models.ts/security-user-session-info';
import { SecurityViewDeviceModel } from '../security.view.models/security.view.types';
import { SecurityInfoDto } from './security-info.model';

export interface SecurityInterface {
  getUserActiveSessions(
    userInfo: UserInfoType,
  ): Promise<SecurityViewDeviceModel[]>;
  terminateOtherUserSessions(userInfo: UserInfoType): Promise<void>;
  terminateSpecificSession(
    data: SecurityInfoDto,
    userInfo: UserInfoType,
  ): Promise<void>;
}
