import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { iSValidField } from '../../../../../infra/decorators/transform/transform-params';
import { contentPostLength } from '../../../../../domain/validation.constants';
import { LikesStatuses } from '../../../../../domain/reaction.models';

export class InputContentDto {
  /**
   *  current content
   */
  @iSValidField(contentPostLength)
  content: string;
}

export type InputCommentDtoType = {
  content: string;
  userId: string;
  postId: string;
};

export class InputCommentDto {
  @iSValidField(contentPostLength)
  content: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  postId: string;
}

export class ReactionCommentDto {
  @IsString()
  @IsNotEmpty()
  commentId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(LikesStatuses, { message: `Invalid like's status value` })
  inputStatus: LikesStatuses;
}
