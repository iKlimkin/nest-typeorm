import { Payload } from '../auth-input.models.ts/jwt.types';

export class UserSessionDto {
  ip: string;
  user_agent_info: string;
  user_id: string;
  device_id: string;
  refresh_token: string;
  rt_issued_at: Date;
  rt_expiration_date: Date;

  constructor(
    ipAddress: string,
    userAgentInfo: string,
    userId: string,
    userPayload: Payload,
    refreshToken: string,
  ) {
    this.ip = ipAddress;
    this.user_agent_info = userAgentInfo;
    this.user_id = userId;
    this.device_id = userPayload.deviceId;
    this.refresh_token = refreshToken;
    this.rt_issued_at = new Date(userPayload.iat! * 1000);
    this.rt_expiration_date = new Date(userPayload.exp! * 1000);
  }
}
