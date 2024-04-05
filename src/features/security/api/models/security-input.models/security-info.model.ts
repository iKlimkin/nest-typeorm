import { IsUUID } from 'class-validator';

export class SecurityInfoDto {
  @IsUUID(4)
  deviceId: string;
}
