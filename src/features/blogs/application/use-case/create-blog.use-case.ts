import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { OutputId } from '../../../../domain/output.models';
import { runInTransaction } from '../../../../domain/transaction-wrapper';
import { GetErrors } from '../../../../infra/utils/interlay-error-handler.ts/error-constants';
import { LayerNoticeInterceptor } from '../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { BlogCreationDto } from '../../api/models/dtos/blog-dto.model';
import { Blog } from '../../domain/entities/blog.entity';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { CreateBlogCommand } from './commands/create-blog.command';

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    private blogsRepo: BlogsRepository,
    private userRepo: UsersRepository,
    private dataSource: DataSource,
  ) {}

  async execute(
    command: CreateBlogCommand,
  ): Promise<LayerNoticeInterceptor<OutputId>> {
    return runInTransaction(this.dataSource, async (manager) => {
      const notice = new LayerNoticeInterceptor<OutputId>();
      const { description, name, websiteUrl, userId } = command.data;
      const user = await this.userRepo.getUserById(userId);
      const createBlogDto = new BlogCreationDto(
        name,
        description,
        websiteUrl,
        user,
      );
      const createdBlogNotice = await Blog.create(createBlogDto);

      if (createdBlogNotice.hasError) return createdBlogNotice;

      const result = await this.blogsRepo.save(createdBlogNotice.data, manager);

      notice.addData(result);
      return notice;
    });
  }
}
