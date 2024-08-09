import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UpdateBlogDto } from '../api/models/input.blog.models/update-blog-models';
import { Blog } from '../domain/entities/blog.entity';
import { Subscription } from '../domain/entities/blog-subscription.entity';
import { UserAccount } from '../../auth/infrastructure/settings';

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
    @InjectRepository(Subscription)
    private readonly sub: Repository<Subscription>,
  ) {}

  async save(blogDto: Blog, manager: EntityManager): Promise<Blog> {
    try {
      return await manager.save(Blog, blogDto);
    } catch (error) {
      throw new Error(`blog is not saved: ${error}`);
    }
  }
  async saveEntity<T>(entity: T, manager: EntityManager): Promise<T> {
    try {
      return await manager.save(entity);
    } catch (error) {
      throw new Error(`entity is not saved: ${error}`);
    }
  }

  async findBlogSubscription(
    blogId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<Subscription | null> {
    try {
      return await manager
        .getRepository(Subscription)
        .findOne({ where: { blog: { id: blogId }, user: { id: userId } } });
    } catch (error) {
      throw new Error(`blogSubscription: ${error}`);
    }
  }

  async getBlogWithSubscription(
    blogId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<{ blog: Blog; subscription: Subscription } | null> {
    try {
      const queryBuilder = manager
        .createQueryBuilder(Blog, 'blog')
        .select('blog.id')
        .leftJoin('blog.user', 'user')
        .addSelect('user.id')
        .where('blog.id = :blogId', { blogId });

      const blog = await queryBuilder.getOne();
      const subscription = await queryBuilder
        .leftJoinAndSelect('blog.subscriptions', 'subscription')
        .andWhere('subscription.userId = :userId', { userId })
        .getOne();

      return { blog, subscription: subscription?.subscriptions[0] };
    } catch (error) {
      throw new Error(`blogSubscription: ${error}`);
    }
  }

  async getSubscribersForBlog(blogId: string): Promise<Subscription[]> {
    try {
      return await this.sub.find({ where: { blog: { id: blogId } } });
    } catch (error) {
      throw new Error(`getSubscribersForBlog: ${error}`);
    }
  }

  async getBlogById(blogId: string): Promise<Blog | null> {
    try {
      return await this.blogs.findOne({
        where: {
          id: blogId,
        },
        relations: {
          user: true,
        },
      });
    } catch (error) {
      console.log(`Database fails operate during get blog by id ${error}`);
      return null;
    }
  }

  async updateBlog(updateBlogDto: UpdateBlogDto): Promise<boolean> {
    try {
      const { blogId, description, name, websiteUrl } = updateBlogDto;

      const result = await this.blogs.update(
        { id: blogId },
        { title: name, description, websiteUrl },
      );

      return result.affected !== 0;
    } catch (e) {
      console.error(`Database fails operate during the upgrade blog`, e);
      return false;
    }
  }

  async deleteBlog(blogId: string, manager: EntityManager): Promise<boolean> {
    try {
      const result = await manager.delete(Blog, { id: blogId });

      return result.affected !== 0;
    } catch (error) {
      throw new Error(`Database fails operate during the delete blog ${error}`);
    }
  }
}
