import { CreateBlogCommandDto } from '../../../api/models/input.blog.models/create.blog.model';

export class CreateBlogCommand {
  constructor(public data: CreateBlogCommandDto) {}
}
