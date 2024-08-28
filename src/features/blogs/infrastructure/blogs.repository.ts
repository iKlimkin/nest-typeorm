import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UpdateBlogDto } from '../api/models/input.blog.models/update-blog-models';
import { Blog } from '../domain/entities/blog.entity';
import { BlogNotifySubscription } from '../domain/entities/blog-subscription.entity';
import { BaseRepository } from '../../../domain/base-repository';

@Injectable()
export class BlogsRepository extends BaseRepository {
  constructor(
    @InjectRepository(Blog) private readonly blogsRepo: Repository<Blog>,
    @InjectRepository(BlogNotifySubscription)
    private readonly subRepo: Repository<BlogNotifySubscription>,
  ) {
    super();
  }

  async save(blogDto: Blog, manager: EntityManager): Promise<Blog> {
    try {
      return await manager.save(Blog, blogDto);
    } catch (error) {
      throw new Error(`blog is not saved: ${error}`);
    }
  }

  async findBlogSubscription(
    blogId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<BlogNotifySubscription | null> {
    try {
      return await manager
        .getRepository(BlogNotifySubscription)
        .findOne({ where: { blog: { id: blogId }, user: { id: userId } } });
    } catch (error) {
      throw new Error(`blogSubscription: ${error}`);
    }
  }

  async getBlogWithSubscription(
    blogId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<{ blog: Blog; subscription: BlogNotifySubscription } | null> {
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

      return { blog, subscription: subscription?.notifySubscriptions[0] };
    } catch (error) {
      throw new Error(`blogSubscription: ${error}`);
    }
  }

  async getSubscribersForBlog(
    blogId: string,
  ): Promise<BlogNotifySubscription[]> {
    try {
      return await this.subRepo.find({ where: { blog: { id: blogId } } });
    } catch (error) {
      throw new Error(`getSubscribersForBlog: ${error}`);
    }
  }

  async getBlogById(blogId: string): Promise<Blog | null> {
    try {
      return await this.blogsRepo.findOne({
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

  async getMembershipPlanModels(planId: string): Promise<Blog | null> {
    try {
      return await this.blogsRepo
        .createQueryBuilder('blog')
        .select('blog.id')
        .leftJoinAndSelect('blog.subscriptionPlanModels', 'plan')
        .where('plan.productId = :planId', { planId })
        .getOne();
    } catch (error) {
      console.log(
        `Database fails operate during get membership plan by planId: ${error}`,
      );
      return null;
    }
  }

  async getMembershipUserPlan(userId: string, blogId: string) {
    try {
    } catch (error) {
      throw new Error(
        `Database fails operate during the get user plan ${error}`,
      );
    }
  }

  async updateBlog(updateBlogDto: UpdateBlogDto): Promise<boolean> {
    try {
      const { blogId, description, name, websiteUrl } = updateBlogDto;

      const result = await this.blogsRepo.update(
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
