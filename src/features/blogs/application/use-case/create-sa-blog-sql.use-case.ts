import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/likes.types';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { BlogDtoSqlModel } from '../../api/models/blog-sql.model';
import { BlogsSqlRepository } from '../../infrastructure/blogs.sql-repository';
import { CreateSABlogSqlCommand } from './commands/create-sa-blog-sql.command';
import { BlogsTORRepo } from '../../infrastructure/blogs.typeorm-repository';

@CommandHandler(CreateSABlogSqlCommand)
export class CreateBlogSASqlUseCase
  implements ICommandHandler<CreateSABlogSqlCommand>
{
  constructor(
    private blogsSqlRepository: BlogsSqlRepository,
    private readonly blogsRepo: BlogsTORRepo,
  ) {}

  async execute(command: CreateSABlogSqlCommand): Promise<OutputId | null> {
    await validateOrRejectModel(command, CreateSABlogSqlCommand);

    const { description, name, websiteUrl } = command.createBlogDto;

    const blogDto = new BlogDtoSqlModel(name, description, websiteUrl);

    return this.blogsRepo.createBlog(blogDto);
  }
}
