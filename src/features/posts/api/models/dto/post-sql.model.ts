import { CreatePostByBlogIdModel } from "../input.posts.models/create.post.model";

export class PostCreationDto {
  public createPostDto: CreatePostSqlType;
  constructor(input: CreatePostByBlogIdModel) {
    this.createPostDto = {
      title: input.title,
      blogId: input.blogId,
      blog_title: input.blogTitle,
      short_description: input.shortDescription,
      content: input.content,
    };
  }
}

type CreatePostSqlType = {
  title: string;
  blogId: string;
  blog_title: string;
  short_description: string;
  content: string;
};


