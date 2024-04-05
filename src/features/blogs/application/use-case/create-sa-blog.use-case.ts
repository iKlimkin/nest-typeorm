import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/likes.types';
import { CreateSABlogCommand } from './commands/create-sa-blog.command';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { validateOrRejectModel } from '../../../../infra/utils/validators/validate-or-reject.model';
import { BlogCreationDto } from '../../api/models/dto/blog-dto.model';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

@CommandHandler(CreateSABlogCommand)
export class CreateBlogSAUseCase
  implements ICommandHandler<CreateSABlogCommand>
{
  constructor(private readonly blogsRepo: BlogsRepository) {}

  async execute(
    command: CreateSABlogCommand,
  ): Promise<LayerNoticeInterceptor<OutputId | null>> {
    const notice = new LayerNoticeInterceptor<OutputId | null>();

    try {
      await validateOrRejectModel(command, CreateSABlogCommand);
    } catch (e) {
      notice.addError('incorrect model', 'validator', GetErrors.IncorrectModel);
    }

    const { description, name, websiteUrl } = command.createData;

    const blogDto = new BlogCreationDto(name, description, websiteUrl);

    const result = await this.blogsRepo.createBlog(blogDto);

    if (!result) {
      notice.addError(
        `blog not created `,
        'CreateBlogUseCase',
        GetErrors.DatabaseFail,
      );
    } else {
      notice.addData(result);
    }

    return notice;
  }
}
