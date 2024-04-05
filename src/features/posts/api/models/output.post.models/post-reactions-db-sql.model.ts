import { likesStatus } from '../../../../../domain/likes.types';

export type PostReactionsSqlDbType = {
  id: string;
  post_id: string;
  user_id: string;
  user_login: string;
  reaction_type: likesStatus;
  liked_at: Date;
};
