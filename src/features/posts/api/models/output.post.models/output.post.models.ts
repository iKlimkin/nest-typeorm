import {
  LikesUserInfoType,
  LikesCountType,
  LikesStatuses,
  ReactionsCounter,
} from '../../../../../domain/reaction.models';

export type PostType = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;

  likesUserInfo: LikesUserInfoType[];

  likesCountInfo: LikesCountType;
};

// export type PostsSqlDbType = {
//   id: string;
//   blog_id: string;
//   blog_title: string;
//   title: string;
//   short_description: string;
//   content: string;
//   created_at: Date;
// };

// export class PostReactionCounter extends ReactionsCounter {
//   post_id: string;
// }

// export type UserPostReactionsType = {
//   liked_at: Date;
//   user_login: string;
//   user_id: string;
//   post_id: string;
//   reaction_type: LikesStatuses;
// };

// export type UserReactionsOutType = Pick<
//   UserPostReactionsType,
//   'reaction_type'
// > & { post_id: string };
