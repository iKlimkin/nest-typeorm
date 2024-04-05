import { UserInfoType } from '../../../../auth/api/models/auth-input.models.ts/user-info';
import { SecurityViewDeviceModel } from '../security.view.models/security.view.types';

export interface SecurityInterface {
  getUserActiveSessions(
    userInfo: UserInfoType,
  ): Promise<SecurityViewDeviceModel[]>;
  terminateOtherUserSessions(userInfo: UserInfoType): Promise<void>;
  terminateSpecificSession(
    deviceId: string,
    userInfo: UserInfoType,
  ): Promise<void>;
}
