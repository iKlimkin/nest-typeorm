import { InputBlogModel, InputBlogSAModel } from "../../../api/models/input.blog.models/create.blog.model";

export class CreateSABlogSqlCommand {
    constructor(public createBlogDto: InputBlogModel) {}
  }