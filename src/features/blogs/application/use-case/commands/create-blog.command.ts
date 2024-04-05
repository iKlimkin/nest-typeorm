import { CreateBlogInputDto } from "../../../api/models/input.blog.models/create.blog.model";

export class CreateBlogCommand {
    constructor(public createData: CreateBlogInputDto) {}
  }