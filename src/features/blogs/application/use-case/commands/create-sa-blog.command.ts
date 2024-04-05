import { CreateBlogInputDto } from '../../../api/models/input.blog.models/create.blog.model';

export class CreateSABlogCommand {
  constructor(public createData: CreateBlogInputDto) {}
}
