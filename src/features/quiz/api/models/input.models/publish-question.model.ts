import { IsBoolean, IsNotEmpty } from 'class-validator';

export class InputPublishData {
  @IsNotEmpty()
  @IsBoolean()
  published: boolean;
}
