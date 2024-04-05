import { InputBlogModel } from "../../../api/models/input.blog.models/create.blog.model";

export class CreateBlogSqlCommand {
    constructor(public createBlogDto: InputBlogModel) {}
  }