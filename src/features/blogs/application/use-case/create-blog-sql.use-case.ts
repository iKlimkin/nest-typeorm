import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutputId } from '../../../../domain/likes.types';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { BlogDtoSqlModel } from '../../api/models/blog-sql.model';
import { BlogsSqlRepository } from '../../infrastructure/blogs.sql-repository';
import { CreateBlogSqlCommand } from './commands/create-blog-sql.command';

@CommandHandler(CreateBlogSqlCommand)
export class CreateBlogSqlUseCase
  implements ICommandHandler<CreateBlogSqlCommand>
{
  constructor(private blogsSqlRepository: BlogsSqlRepository) {}

  async execute(command: CreateBlogSqlCommand): Promise<OutputId | null> {
    await validateOrRejectModel(command, CreateBlogSqlCommand);

    const { description, name, websiteUrl } = command.createBlogDto;

    const blogDto = new BlogDtoSqlModel(name, description, websiteUrl);

    return this.blogsSqlRepository.save(blogDto);
  }
}
