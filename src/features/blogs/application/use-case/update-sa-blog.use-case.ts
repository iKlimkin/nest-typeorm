import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { UpdateSABlogCommand } from './commands/update-sa-blog.command';

@CommandHandler(UpdateSABlogCommand)
export class UpdateSABlogUseCase
  implements ICommandHandler<UpdateSABlogCommand>
{
  constructor(private blogsRepo: BlogsRepository) {}
  async execute(
    updateBlogDto: UpdateSABlogCommand,
  ): Promise<LayerNoticeInterceptor<boolean>> {
    const notice = new LayerNoticeInterceptor<boolean>();

    const result = await this.blogsRepo.updateBlog(updateBlogDto.updateData);

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
