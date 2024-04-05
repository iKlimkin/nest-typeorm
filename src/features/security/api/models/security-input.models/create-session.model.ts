import {
  IsObject,
  IsDefined,
  IsString,
  IsNotEmpty,
  IsIP,
  IsOptional,
} from 'class-validator';
import { Payload } from '../../../../auth/api/models/auth-input.models.ts/jwt.types';
import { DeviceInfo } from '../../../../../infra/utils/device-handler';

export class SessionCreationDto {
  @IsObject()
  @IsDefined()
  userPayload: Payload;

  @IsString()
  @IsNotEmpty()
  @IsIP()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  browser: string;

  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @IsObject()
  @IsOptional()
  userAgentInfo?: DeviceInfo;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
