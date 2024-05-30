import { UserSessionDto } from './security-session-info.model';
import { SecurityViewDeviceModel } from '../security.view.models/security.view.types';

export interface SecurityInterface {
  getUserActiveSessions(
    userInfo: UserSessionDto,
  ): Promise<SecurityViewDeviceModel[]>;
  terminateOtherUserSessions(userInfo: UserSessionDto): Promise<void>;
  terminateSpecificSession(
    deviceId: string,
    userInfo: UserSessionDto,
  ): Promise<void>;
}
