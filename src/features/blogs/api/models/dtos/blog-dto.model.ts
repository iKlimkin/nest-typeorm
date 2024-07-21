import { UserAccount } from '../../../../admin/domain/entities/user-account.entity';
import { UpdatePostDto } from '../../../../posts/api/models/input.posts.models/create.post.model';

export class BlogDtoBase {
  constructor(
    public title: string,
    public description: string,
    public websiteUrl: string,
  ) {}
}

export class BlogCreationDto extends BlogDtoBase {
  constructor(
    title: string,
    description: string,
    websiteUrl: string,
    public user: UserAccount,
    public isMembership = false,
  ) {
    super(title, description, websiteUrl);
    this.isMembership = isMembership;
  }
}

export class CreateBlogDto extends BlogCreationDto {
  public userId: string;
}

export class UpdateBlogDto {
  constructor(
    public name: string,
    public description: string,
    public websiteUrl: string,
  ) {}
}

export class UpdateBloggerPostData extends UpdatePostDto {
  blogId: string;
  userId: string;
}
