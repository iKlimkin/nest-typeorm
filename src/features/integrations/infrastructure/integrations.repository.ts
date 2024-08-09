import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TelegramMetaUser } from '../domain/entities/telegram-meta-user.entity';
import { SubscribeEnum } from '../../blogs/api/models/output.blog.models/blog.view.model-type';

@Injectable()
export class IntegrationsRepository {
  constructor(
    @InjectRepository(TelegramMetaUser)
    private readonly telegramMeta: Repository<TelegramMetaUser>,
  ) {}

  async save(telegramMetaDto: TelegramMetaUser): Promise<TelegramMetaUser> {
    try {
      return await this.telegramMeta.save(telegramMetaDto);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getTelegramMetaByUserId(userId: string): Promise<TelegramMetaUser> {
    try {
      return await this.telegramMeta.findOne({ where: { userId } });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getUserIdByTelegramActivationCode(code: string): Promise<string> {
    try {
      const tgMeta = await this.telegramMeta.findOne({
        where: { telegramActivationCode: code },
      });
      if (!tgMeta) return null;

      return tgMeta.userId;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async getUserTelegramIdsByBlogId(
    blogId: string,
  ): Promise<TelegramMetaUser[]> {
    try {
      const queryBuilder = this.telegramMeta.createQueryBuilder('tgMeta');

      queryBuilder
        .select(['tgMeta.telegramId', 'tgMeta.telegramUsername'])
        .leftJoin('tgMeta.user', 'user')
        .leftJoin('user.subscriptions', 'subs')
        .where('subs.blogId = :blogId AND subs.subscribeStatus = :status', {
          blogId,
          status: SubscribeEnum.Subscribed,
        });

      return await queryBuilder.getMany();
    } catch (error) {
      console.log(error);
      throw new Error(error);
    }
  }
}
