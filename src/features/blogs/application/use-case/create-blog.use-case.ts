import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateBlogCommand } from './commands/create-blog.command';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { BlogCreationDto } from '../../api/models/dtos/blog-dto.model';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { OutputId } from '../../../../domain/output.models';

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(private blogsRepo: BlogsRepository) {}

  async execute(
    command: CreateBlogCommand
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const notice = new LayerNoticeInterceptor<OutputId | null>();

    try {
      await validateOrRejectModel(command, CreateBlogCommand);
    } catch (e) {
      notice.addError(
        'incorrect model',
        'CreateBlogUseCase',
        GetErrors.IncorrectModel
      );
    }

    const { description, name, websiteUrl } = command.createData;

    const blogDto = new BlogCreationDto(name, description, websiteUrl);
    
    const result = await this.blogsRepo.createBlog(blogDto);

    if (!result) {
      notice.addError(
        `blog not created `,
        'CreateBlogUseCase',
        GetErrors.DatabaseFail
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
