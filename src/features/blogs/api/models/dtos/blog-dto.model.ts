import { UpdatePostDto } from '../../../../posts/api/models/input.posts.models/create.post.model';

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
