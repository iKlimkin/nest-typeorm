import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { UsersRepository } from '../../../admin/infrastructure/users.repository';
import {
  CommentModelType,
  CommentDocument,
  Comment,
} from '../../domain/entities/comment.schema';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { CreateCommentCommand } from './commands/create-comment.command';

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    @InjectModel(Comment.name) private CommentModel: CommentModelType,
    private feedbacksRepository: FeedbacksRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: CreateCommentCommand): Promise<CommentDocument> {
    const { userId, content, postId } = command.inputData;

    const user = await this.usersRepository.getUserById(userId);
    
    const commentSmartModel = await this.CommentModel.makeInstance({
      commentatorInfo: {
        userId: userId,
        userLogin: user!.accountData.login,
      },
      content: content,
      postId: postId,
    });

    return this.feedbacksRepository.save(commentSmartModel);
  }
}
