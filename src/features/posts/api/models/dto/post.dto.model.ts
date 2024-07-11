import { Blog } from '../../../../../settings';
import {
  CreatePostByBlog,
  CreatePostByBlogIdModel,
} from '../input.posts.models/create.post.model';

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

export interface CreatePostDto extends CreatePostByBlog {
  blog: Blog;
}

type CreatePostSqlType = {
  title: string;
  blogId: string;
  blog_title: string;
  short_description: string;
  content: string;
};
