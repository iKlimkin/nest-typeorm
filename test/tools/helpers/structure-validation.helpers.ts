import { LikesStatuses } from '../../../src/domain/reaction.models';
import { CreationPostDtoByBlogId } from '../../../src/features/blogs/api/controllers';
import { BlogViewModelType } from '../../../src/features/blogs/api/models/output.blog.models/blog.view.model-type';
import { PostViewModelType } from '../../../src/features/posts/api/models/post.view.models/post-view-model.type';

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
  }) as PostViewModelType;
