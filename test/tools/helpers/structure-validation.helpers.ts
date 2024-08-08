import { LikesStatuses } from '../../../src/domain/reaction.models';
import {
  BlogViewModelType,
  SubscribeEnum,
} from '../../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';
import { CommentsViewModel } from '../../../src/features/comments/api/models/comments.view.models/comments.view-model.type';
import { CreationCommentDto } from '../../../src/features/comments/api/models/dtos/comment.dto';
import { CreationPostDtoByBlogId } from '../../../src/features/posts/api/models/input.posts.models/create.post.model';
import { PostViewModelType } from '../../../src/features/posts/api/models/post.view.models/post-view-model.type';
import {
  CommentInputData,
  CreationCommentData,
} from '../managers/PostsTestManager';

export const blogsData = {
  philosophers: [
    'Socrat',
    'Aristotel',
    'Plato',
    'Descartes',
    'Kant',
    'Nietzsche',
    'Confucius',
    'Hume',
    'Russell',
  ],

  description: {
    1: 'Ancient Greek philosopher known for his contributions to ethics and the Socratic method.',
    2: 'Greek philosopher and student of Plato, he founded the Peripatetic school and made significant contributions to various fields.',
    3: 'Greek philosopher who founded the Academy in Athens and wrote philosophical dialogues.',
    4: 'French philosopher, mathematician, and scientist, known for his famous phrase "Cogito, ergo sum" (I think, therefore I am).',
    5: 'German philosopher who developed the concept of transcendental idealism and contributed to ethical philosophy.',
    6: 'German philosopher and cultural critic, known for his critiques of traditional European morality.',
    7: 'Chinese philosopher and teacher, his teachings emphasize morality, family loyalty, and social harmony.',
    8: 'Scottish philosopher known for his empiricism and skepticism, influencing the development of Western philosophy.',
    9: 'British philosopher and logician, a key figure in the development of analytic philosophy in the 20th century.',
  },

  websiteUrl: {
    1: 'https://socrat-yaol.com',
    2: 'https://aristotel-yaol.com',
    3: 'https://plato-yaol.com',
    4: 'https://descartes-yaol.com',
    5: 'https://kant-yaol.com',
    6: 'https://nietzsche-yaol.com',
    7: 'https://confucius-yaol.com',
    8: 'https://hume-yaol.com',
    9: 'https://russell-yaol.com',
  },
};

export const createBlogsDataForTests = (isMembership = false) => {
  let data = [];
  let i = 1;

  while (i !== blogsData.philosophers.length + 1) {
    const currentPhilosopher = blogsData.philosophers[i - 1];

    data.push({
      id: expect.any(String),
      name: currentPhilosopher,
      description: blogsData.description[i],
      websiteUrl: blogsData.websiteUrl[i],
      userId: expect.any(String),
      isMembership,
      createdAt: new Date(new Date().getTime() + i * 1000).toISOString(),
    });

    i++;
  }

  return data;
};

export const blogValidationErrors = {
  errorsMessages: expect.arrayContaining([
    { message: expect.any(String), field: 'name' },
    { message: expect.any(String), field: 'description' },
    { message: expect.any(String), field: 'websiteUrl' },
  ]),
};

export const blogEqualTo = {
  id: expect.any(String),
  name: expect.any(String),
  description: expect.any(String),
  websiteUrl: expect.any(String),
  isMembership: expect.any(Boolean),
  createdAt: expect.any(String),
} as BlogViewModelType;

export const createdPostStructureConsistency = (
  inputData: CreationPostDtoByBlogId,
  blogId?: string,
) =>
  ({
    id: expect.any(String),
    title: inputData.title,
    shortDescription: inputData.shortDescription,
    content: inputData.content,
    blogId: blogId || expect.any(String),
    blogName: expect.any(String),
    createdAt: expect.any(String),
    extendedLikesInfo: {
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikesStatuses.None,
      newestLikes: expect.any(Array),
    },
    images: expect.any(Object),
  }) as PostViewModelType;

export const createdBlogStructureConsistency = (
  inputData?: any,
): BlogViewModelType => ({
  id: expect.any(String),
  name: expect.any(String),
  description: expect.any(String),
  isMembership: expect.any(Boolean),
  createdAt: expect.any(String),
  websiteUrl: expect.any(String),
  images: expect.any(Object),
  currentUserSubscriptionStatus: expect.any(String),
  subscribersCount: expect.any(Number),
});

export const paginationStructureConsistency = () => ({
  pagesCount: expect.any(Number),
  page: expect.any(Number),
  pageSize: expect.any(Number),
  totalCount: expect.any(Number),
  items: expect.any(Array),
});

export const validateImageMetaStructureConsistency = () => ({
  main: expect.arrayContaining([
    expect.objectContaining({
      url: expect.any(String),
      fileSize: expect.any(Number),
      height: expect.any(Number),
      width: expect.any(Number),
    }),
  ]),
  wallpaper: expect.anything(),
});

export const commentStructureConsistency = (
  inputData?: CommentInputData,
): CommentsViewModel => ({
  id: expect.any(String),
  content: inputData?.content || expect.any(String),
  commentatorInfo: {
    userId: expect.any(String),
    userLogin: expect.any(String),
  },
  createdAt: expect.any(String),
  likesInfo: {
    likesCount: inputData?.likesCount || 0,
    dislikesCount: inputData?.dislikesCount || 0,
    myStatus: inputData?.likeStatus || LikesStatuses.None,
  },
});
