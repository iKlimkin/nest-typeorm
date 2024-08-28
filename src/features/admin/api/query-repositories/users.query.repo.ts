import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { UserAccount } from '../../domain/entities/user-account.entity';
import { BloggerBannedUsersQueryFilter } from '../models/outputSA.models.ts/blogger-banned-users.query';
import {
  BanStatus,
  SAQueryFilter,
} from '../models/outputSA.models.ts/query-filters';
import {
  getBloggerBannedUsersView,
  getSAViewModel,
} from '../models/user.view.models/saView.model';
import {
  BloggerBannedUsersViewType,
  SAViewType,
  SAViewWithBannedUsersType,
} from '../models/user.view.models/userAdmin.view-type';

@Injectable()
export class UsersQueryRepo {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccounts: Repository<UserAccount>,
  ) {}

  async getAllUsers(
    queryOptions: SAQueryFilter,
  ): Promise<PaginationViewModel<SAViewType>> {
    const { searchEmailTerm, searchLoginTerm, banStatus } = queryOptions;

    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const [login, email] = [
      `%${searchLoginTerm || ''}%`,
      `%${searchEmailTerm || ''}%`,
    ];

    const queryBuilder = this.userAccounts
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userBan', 'ban')
      .where('(user.login ILIKE :login', { login })
      .orWhere('user.email ILIKE :email)', { email });

    if (banStatus === BanStatus.banned) {
      queryBuilder.andWhere('(ban.isBanned = true)');
    } else if (banStatus === BanStatus.notBanned) {
      queryBuilder.andWhere('(ban IS NULL OR ban.isBanned = false)');
    }

    queryBuilder
      .orderBy('user.' + sortBy, sortDirection)
      .skip(skip)
      .take(pageSize);

    const [users, usersCount] = await queryBuilder.getManyAndCount();

    return new PaginationViewModel<SAViewWithBannedUsersType>(
      users.map(getSAViewModel),
      pageNumber,
      pageSize,
      usersCount,
    );
  }
  catch(error) {
    throw new InternalServerErrorException(
      'Database fails operate with find users by sorting model',
      error,
    );
  }

  async getBannedUsersForBlog(
    blogId: string,
    queryOptions: BloggerBannedUsersQueryFilter,
  ): Promise<PaginationViewModel<BloggerBannedUsersViewType>> {
    const { searchLoginTerm } = queryOptions;
    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const [login] = [`%${searchLoginTerm || ''}%`];

    const queryBuilder = this.userAccounts.createQueryBuilder('user');

    queryBuilder
      .select('user.login', 'login')
      .addSelect('user.id', 'id')
      .where('user.login ILIKE :login', { login })
      .leftJoin('user.bloggerBans', 'bb')
      .addSelect('bb.banDate', 'banDate')
      .addSelect('bb.banReason', 'banReason')
      .andWhere(
        'user.id IN (SELECT "userId" FROM user_blogger_bans WHERE "isBanned" = true AND "blogId" = :blogId)',
        { blogId },
      )
      .orderBy('user.' + sortBy, sortDirection)
      .limit(pageSize)
      .offset(skip);

    try {
      const users = await queryBuilder.getRawMany();
      const usersCount = await queryBuilder.getCount();

      return new PaginationViewModel<BloggerBannedUsersViewType>(
        users.map(getBloggerBannedUsersView),
        pageNumber,
        pageSize,
        usersCount,
      );
    } catch (error) {
      console.error(`get blogger banned users: ${error}`);
    }
  }

  async getById(userId: string): Promise<SAViewType | null> {
    try {
      const result = await this.userAccounts.findOneBy({ id: userId });

      if (!result) return null;

      return getSAViewModel(result);
    } catch (error) {
      console.error('Database fails operate with find user', error);
      return null;
    }
  }
}
