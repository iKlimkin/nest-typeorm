import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import { OutputId } from '../../../../domain/likes.types';
import { InputBlogModel } from '../../api/models/input.blog.models/create.blog.model';
import { Blog, BlogModelType } from '../../domain/entities/blog.schema';
import { BlogsRepository } from '../../infrastructure/blogs.repository';
import { validateOrRejectModel } from '../../../../infra/validators/validate-or-reject.model';
import { BadRequestException } from '@nestjs/common';

export class CreateBlogCommand {
  constructor(public createBlogDto: InputBlogModel) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<OutputId> {
    await validateOrRejectModel(command, CreateBlogCommand);

    const smartBlogModel = await this.BlogModel.makeInstance(
      command.createBlogDto,
    );

    return this.blogsRepository.save(smartBlogModel);
  }
}
