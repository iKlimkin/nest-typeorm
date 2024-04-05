import { WithId } from 'mongodb';
import {
  SecurityDeviceType,
  SecurityViewDeviceModel,
} from './security.view.types';

export type SecurityDBType = WithId<SecurityDeviceType>;

export const getSecurityViewModel = (
  session: SecurityDBType,
): SecurityViewDeviceModel => ({
  ip: session.ip,
  title: session.title,
  lastActiveDate: session.issuedAt,
  deviceId: session.deviceId,
});


