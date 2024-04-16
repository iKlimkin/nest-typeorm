import { IsNotEmpty, Length, Matches } from 'class-validator';
import {
  descriptionLength,
  nameLength,
  urlLength,
  urlMatching,
} from '../../../../../domain/validation.constants';
import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-field';

export class CreateBlogInputDto {
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

export class InputBlogSAModel extends CreateBlogInputDto {
  userId: string;

  // @iSValidField(loginLength, loginMatch)
  // userLogin: string;
}
