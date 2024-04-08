import { Injectable } from '@nestjs/common';
import { PostsRepository } from '../infrastructure/posts.repository';

@Injectable()
export class PostsService {
  constructor(private postsRepository: PostsRepository) {}
}
