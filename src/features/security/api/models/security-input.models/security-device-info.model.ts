import { IsUUID } from 'class-validator';

export class SecurityDeviceInfoDto {
  @IsUUID(4)
  deviceId: string;
}
