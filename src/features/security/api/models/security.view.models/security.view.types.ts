export type SecurityDeviceModel = {
  ip: string;
  title: string;
  lastActiveDate: string;
  deviceId: string;
  expirationDate: string;
};

export type SecurityViewDeviceModel = Omit<
  SecurityDeviceModel,
  'expirationDate'
>;

export type SecurityDeviceType = {
  ip: string;
  title: string;
  userId: string;
  deviceId: string;
  refreshToken: string;
  issuedAt: string;
  expirationDate: string;
};
