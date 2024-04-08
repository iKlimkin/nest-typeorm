import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { UserAccount } from '../../domain/entities/user-account.entity';
import { SAQueryFilter } from '../models/outputSA.models.ts/sa-query.filter';
import { getSAViewSQLModel } from '../models/userAdmin.view.models/saView.model';
import { SAViewType } from '../models/userAdmin.view.models/userAdmin.view.model';

@Injectable()
export class UsersQueryRepo {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccounts: Repository<UserAccount>,
  ) {}

  async getAllUsers(
    queryOptions: SAQueryFilter,
  ): Promise<PaginationViewModel<SAViewType>> {
    const { searchEmailTerm, searchLoginTerm } = queryOptions;

    const { pageNumber, pageSize, skip, sortBy, sortDirection } = getPagination(
      queryOptions,
      false,
      !0,
    );

    const searchTerms = [
      `%${searchLoginTerm ? searchLoginTerm : ''}%`,
      `%${searchEmailTerm ? searchEmailTerm : ''}%`,
    ];
    const queryBuilder = this.userAccounts.createQueryBuilder('user_accounts');

    queryBuilder
      .where(
        'user_accounts.login ILIKE :login OR user_accounts.email ILIKE :email',
        { login: searchTerms[0], email: searchTerms[1] },
      )
      .orderBy(
        sortBy !== 'created_at'
          ? `user_accounts.${sortBy} COLLATE "C"`
          : 'user_accounts.created_at',
        sortDirection,
      )
      .skip(skip)
      .take(pageSize);

    const result = await queryBuilder.getManyAndCount();

    const users = result[0];
    const usersCount = result[1];

    const userSAViewType = new PaginationViewModel<SAViewType>(
      users.map(getSAViewSQLModel),
      pageNumber,
      pageSize,
      usersCount,
    );

    return userSAViewType;
  }
  catch(error) {
    throw new InternalServerErrorException(
      'Database fails operate with find users by sorting model',
      error,
    );
  }

  async getUserById(userId: string): Promise<SAViewType | null> {
    try {
      const result = await this.userAccounts.findOneBy({ id: userId });

      if (!result) return null;

      return getSAViewSQLModel(result);
    } catch (error) {
      console.error('Database fails operate with find user', error);
      return null;
    }
  }
}
