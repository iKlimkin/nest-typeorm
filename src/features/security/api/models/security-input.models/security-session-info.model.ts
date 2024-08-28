import { IsUUID, IsNotEmpty, IsOptional, IsDate } from 'class-validator';

export class UserSessionDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsUUID()
  @IsNotEmpty()
  deviceId: string;
}

export class DeviceInfoDto extends UserSessionDto{
  @IsDate()
  @IsNotEmpty()
  issuedAt: Date;

  @IsDate()
  @IsNotEmpty()
  expirationDate: Date;
}

