import { IsOptional, IsString } from 'class-validator';
import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-string';
import { BlogIdIsExist } from '../../../../../infra/decorators/validate/valid-blogId';
import {
  titleLength,
  frequentLength,
  contentLength,
  blogIdLength,
} from '../../../../../domain/validation.constants';

export type CreatePostByBlog = Omit<CreatePostModel, 'blogId'>;

export type CreatePostModel = {
  /**
   *  post's title
   */
  title: string;

  /**
   * shortDescription of the post
   */
  shortDescription: string;

  /**
   * content of existing post
   */
  content: string;

  /**
   * search blog id
   */
  blogId: string;
};

export class CreationPostDto {
  /**
   *  post's title
   */
  @iSValidField(titleLength)
  title: string;

  /**
   * shortDescription of the post
   */
  @iSValidField(frequentLength)
  shortDescription: string;

  /**
   * content of existing post
   */
  @iSValidField(contentLength)
  content: string;

  /**
   * search blog id
   */
  @iSValidField(blogIdLength)
  @BlogIdIsExist("blogId doesn't exist")
  blogId: string;
}

export class CreationPostDtoByBlogId {
  /**
   *  post's title
   */
  @iSValidField(titleLength)
  title: string;

  /**
   * shortDescription of the post
   */
  @iSValidField(frequentLength)
  shortDescription: string;

  /**
   * content of existing post
   */
  @iSValidField(contentLength)
  content: string;
}
export class CreatePostByBlogIdModel extends CreationPostDtoByBlogId {
  @IsString()
  blogId: string;

  @IsString()
  blogTitle: string;
}

export class UpdatePostDto extends CreationPostDtoByBlogId {
  @IsString()
  postId: string;
}
