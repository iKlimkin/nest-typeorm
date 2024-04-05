export class PostCreationDto {
  constructor(public createPostDto: CreatePostSqlType) {}
}

type CreatePostSqlType = {
  title: string;
  blog_id: string;
  blog_title: string;
  short_description: string;
  content: string;
};
