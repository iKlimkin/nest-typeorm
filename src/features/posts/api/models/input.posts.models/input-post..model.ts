import { IsEnum } from 'class-validator';
import { likesStatus } from '../../../../../domain/likes.types';

export class InputLikeStatusModel {
  @IsEnum(likesStatus, { message: `Invalid like's status value` })
  likeStatus: likesStatus;
}
