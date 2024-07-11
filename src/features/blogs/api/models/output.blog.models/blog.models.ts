export type BlogType = {
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type BlogsTypeWithId = BlogType & { id: string };

export type BlogsRawDbType = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  websiteUrl: string;
  created_at: Date;
  is_membership: boolean;
};
