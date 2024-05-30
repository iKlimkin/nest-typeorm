import { UserSession } from '../../../domain/entities/security.entity';
import { SecurityViewDeviceModel } from './security.view.types';

export const getSessionViewModel = (
  session: UserSession,
): SecurityViewDeviceModel => ({
  ip: session.ip,
  title: session.user_agent_info,
  lastActiveDate: session.rt_issued_at.toISOString(),
  deviceId: session.device_id,
});
