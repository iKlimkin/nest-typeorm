import { IsUUID, IsNotEmpty, IsOptional, IsDate } from 'class-validator';

export class UserSessionDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsNotEmpty()
  deviceId: string;
}

export class DeviceInfoDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId: string;

  @IsDate()
  @IsNotEmpty()
  issuedAt: Date;

  @IsDate()
  @IsNotEmpty()
  expirationDate: Date;
}
