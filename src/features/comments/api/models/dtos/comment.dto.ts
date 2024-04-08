export class CreationCommentDto {
  constructor(public createData: CreateCommentType) {}
}

type CreateCommentType = {
  postId: string;
  userId: string;
  userLogin: string;
  content: string;
};
