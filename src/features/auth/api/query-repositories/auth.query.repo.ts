import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, MoreThan, Repository } from 'typeorm';
import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { UserAccountViewModel } from '../models/auth.output.models/auth.output.models';
import { LoginOrEmailType } from '../models/auth.output.models/auth.user.types';
import { getUserAccountViewModel } from '../models/auth.output.models/auth.view.model';

@Injectable()
export class AuthQueryRepository {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccounts: Repository<UserAccount>,
  ) {}

  async findByLoginOrEmail(
    inputData: LoginOrEmailType,
  ): Promise<UserAccountViewModel | null> {
    try {
      const { email, login, loginOrEmail } = inputData;

      const conditions: FindOptionsWhere<UserAccount>[] = [
        { email: Like('' + email) },
        { login: Like('' + login) },
        { email: Like('' + loginOrEmail) },
        { login: Like('' + loginOrEmail) },
      ];

      const result = await this.userAccounts.findOne({ where: conditions });

      if (!result) return null;

      return getUserAccountViewModel(result);
    } catch (e) {
      console.error(
        `there were some problems during find user by login or email, ${e}`,
      );
      return null;
    }
  }

  async findUserAccountByRecoveryCode(
    recoveryCode: string,
  ): Promise<UserAccountViewModel | null> {
    try {
      const currentTime = new Date();

      const result = await this.userAccounts.find({
        where: {
          password_recovery_code: recoveryCode,
          password_recovery_expiration_date: MoreThan(currentTime),
        },
      });

      if (!result) return null;

      return getUserAccountViewModel(result[0]);
    } catch (e) {
      console.error(
        `there were some problems during find user by recovery code, ${e}`,
      );
      return null;
    }
  }

  async getUserById(userId: string): Promise<UserAccountViewModel | null> {
    try {
      const result = await this.userAccounts.findOneBy({ id: userId });

      if (!result) return null;

      return getUserAccountViewModel(result);
    } catch (error) {
      console.error('Database fails operate with find user', error);
      return null;
    }
  }
}
