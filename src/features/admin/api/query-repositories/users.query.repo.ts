import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationViewModel } from '../../../../domain/sorting-base-filter';
import { getPagination } from '../../../../infra/utils/get-pagination';
import { UserAccount } from '../../domain/entities/user-account.entity';
import { SAQueryFilter } from '../models/outputSA.models.ts/sa-query.filter';
import { getSAViewModel } from '../models/userAdmin.view.models/saView.model';
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

    const { pageNumber, pageSize, skip, sortBy, sortDirection } =
      getPagination(queryOptions);

    const searchTerms = [
      `%${searchLoginTerm ? searchLoginTerm : ''}%`,
      `%${searchEmailTerm ? searchEmailTerm : ''}%`,
    ];

    const [users, usersCount] = await this.userAccounts
      .createQueryBuilder('user')
      .where('user.login ILIKE :login OR user.email ILIKE :email', {
        login: searchTerms[0],
        email: searchTerms[1],
      })
      .orderBy(
        sortBy !== 'created_at'
          ? `user.${sortBy} COLLATE "C"`
          : 'user.created_at',
        sortDirection,
      )
      .skip(skip)
      .take(pageSize)
      .getManyAndCount();

    return new PaginationViewModel<SAViewType>(
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

  async getUserById(userId: string): Promise<SAViewType | null> {
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
