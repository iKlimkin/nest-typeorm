import { Details } from 'express-useragent';
import { JwtPayload } from 'jsonwebtoken';

export type InputSessionData = {
  userPayload: JwtPayload;
  ip: string;
  browser: string;
  deviceType: string;
  userAgentInfo: Details | undefined;
  userId: string;
  refreshToken: string;
};
