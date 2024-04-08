import { IsEnum } from 'class-validator';
import { LikesStatuses } from '../../../../../domain/reaction.models';

export class LikeStatusInputDto {
  @IsEnum(LikesStatuses, { message: `Invalid like's status value` })
  likeStatus: LikesStatuses;
}
