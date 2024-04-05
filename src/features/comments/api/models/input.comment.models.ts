import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { iSValidField } from '../../../../infra/decorators/transform/is-valid-string';
import { contentPostLength } from '../../../../domain/validation.constants';
import { Types, isValidObjectId } from 'mongoose';
import { likesStatus } from '../../../../domain/likes.types';

export class InputContentModel {
  /**
   *  current content
   */
  @iSValidField(contentPostLength)
  content: string;
}

export type InputCommentModelType = {
  content: string;
  userId: string;
  postId: string;
};

export class InputCommentModel {
  @iSValidField(contentPostLength)
  content: string;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  postId: string;
}

export class ReactionDataModel {
  @IsString()
  @IsNotEmpty()
  commentId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(likesStatus, { message: `Invalid like's status value` })
  inputStatus: likesStatus;
}
