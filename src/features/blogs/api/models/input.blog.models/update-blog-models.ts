import { Matches, IsNotEmpty, Length } from 'class-validator';
import {
  nameLength,
  descriptionLength,
  urlMatching,
  urlLength,
} from '../../../../../domain/validation.constants';
import { iSValidField } from '../../../../../infra/decorators/transform/transform-params';

export class UpdateBlogInputDto {
  /**
   * name of the blog
   */
  @iSValidField(nameLength)
  name: string;

  /**
   * description of the blog.
   */
  @iSValidField(descriptionLength)
  description: string;

  /**
   * websiteUrl for the blog.
   */
  @Matches(urlMatching) // @IsUrl()
  @IsNotEmpty()
  @Length(urlLength.min, urlLength.max)
  websiteUrl: string;
}

export class UpdateBlogDto extends UpdateBlogInputDto {
  blogId: string;
  userId: string;
}
