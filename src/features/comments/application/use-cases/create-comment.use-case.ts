import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { PostsService } from '../../../posts/application/posts.service';
import { Comment } from '../../domain/entities/comment.entity';
import { FeedbacksRepository } from '../../infrastructure/feedbacks.repository';
import { CreateCommentCommand } from './commands/create-comment.command';

@CommandHandler(CreateCommentCommand)
export class CreateCommentUseCase
  implements ICommandHandler<CreateCommentCommand>
{
  private readonly location: string;
  constructor(
    private postService: PostsService,
    private feedbacksRepo: FeedbacksRepository,
    private dataSource: DataSource,
  ) {
    this.location = this.constructor.name;
  }

  async execute(
    command: CreateCommentCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<OutputId>();

      const { userId, content, postId } = command.createData;

      const userRightsNotice =
        await this.postService.getAndCheckUserRightsToCreateComment(
          userId,
          postId,
        );
      if (userRightsNotice.hasError)
        return userRightsNotice as LayerNoticeInterceptor;
      const { login } = userRightsNotice.data.user;

      const createdCommentNotice = await Comment.create({
        postId,
        userId,
        login,
        content,
      });
      if (createdCommentNotice.hasError) return createdCommentNotice;
      const commentDto = createdCommentNotice.data;
      const comment = await this.feedbacksRepo.save(commentDto, manager);

      if (comment) {
        notice.addData(comment);
      } else {
        notice.addError(
          'Comment not created',
          this.location,
          GetErrors.DatabaseFail,
        );
      }

      return notice;
    });
  }
}
