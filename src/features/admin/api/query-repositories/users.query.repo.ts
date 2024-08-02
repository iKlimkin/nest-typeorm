import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { UserAccount } from '../../domain/entities/user-account.entity';
import { BloggerBannedUsersQueryFilter } from '../models/outputSA.models.ts/blogger-banned-users.query';
import {
  BanStatus,
  SAQueryFilter,
} from '../models/outputSA.models.ts/sa-query.filter';
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
    @InjectDataSource() private dataSource: DataSource,
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

    // raw users
    // let totalCountQuery = `
    //   SELECT COUNT(*) AS "totalCount"
    //   FROM user_account u
    //   LEFT JOIN user_bans bans ON u.id = bans."userId"
    //   WHERE (u.login ILIKE $1 OR u.email ILIKE $2)
    // `;

    // let addWhereBanStatus = '';
    // if (banStatus === BanStatus.banned) {
    //   addWhereBanStatus += 'AND bans."isBanned" = true';
    // } else if (banStatus === BanStatus.notBanned) {
    //   addWhereBanStatus += 'AND (bans IS NULL OR bans."isBanned" = false)';
    // }
    // totalCountQuery = totalCountQuery.concat(addWhereBanStatus);

    // const [{ totalCount }] = await this.dataSource.query(totalCountQuery, [
    //   login,
    //   email,
    // ]);

    // let getUsersQuery = `
    //   SELECT
    //   u.login,
    //   u.email,
    //   u.id,
    //   u.created_at "createdAt",
    //   bans."banReason",
    //   bans."isBanned",
    //   bans."banDate"
    //   FROM user_account u
    //   LEFT JOIN user_bans bans ON u.id = bans."userId"
    //   WHERE (u.login ILIKE $1 OR u.email ILIKE $2)
    // `;
    // getUsersQuery = getUsersQuery.concat(addWhereBanStatus);

    // getUsersQuery += `
    //   ORDER BY u.${
    //     sortBy === 'created_at' ? 'created_at' : sortBy + ' COLLATE "C"'
    //   } ${sortDirection}
    //   LIMIT $3
    //   OFFSET $4;`;

    // const rawUsers = await this.dataSource.query(getUsersQuery, [
    //   login,
    //   email,
    //   pageSize,
    //   skip,
    // ]);

    // return new PaginationViewModel<SAViewWithBannedUsersType>(
    //   rawUsers.map((rawUser) => ({
    //     id: rawUser.id,
    //     login: rawUser.login,
    //     email: rawUser.email,
    //     createdAt: rawUser.createdAt.toISOString(),
    //     banInfo: {
    //       isBanned: rawUser.isBanned || false,
    //       banDate: rawUser.banDate?.toISOString() || null,
    //       banReason: rawUser.banReason || null,
    //     },
    //   })),
    //   pageNumber,
    //   pageSize,
    //   totalCount,
    // );

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
