import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UpdateBlogCommand } from './commands/update-blog.command';

@CommandHandler(UpdateBlogCommand)
export class UpdateBlogUseCase implements ICommandHandler<UpdateBlogCommand> {
  constructor(private blogsRepo: BlogsRepository) {}
  async execute(
    command: UpdateBlogCommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    const notice = new LayerNoticeInterceptor<boolean>();

    const result = await this.blogsRepo.updateBlog(command.updateData);

    if (!result) {
      notice.addError(
        `Couldn't update SA blog`,
        'UpdateSABlogSqlUseCase',
        GetErrors.DatabaseFail,
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
