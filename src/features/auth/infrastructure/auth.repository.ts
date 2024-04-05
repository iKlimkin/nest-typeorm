import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, FindOptionsWhere, MoreThanOrEqual, Repository } from 'typeorm';
import { OutputId } from '../../../domain/likes.types';
import { UserAccount } from '../../admin/domain/entities/user-account.entity';
import { UserRecoveryType } from '../api/models/auth.output.models/auth.output.models';
import { LoginOrEmailType } from '../api/models/auth.output.models/auth.user.types';
import { CreateTempAccountDto } from '../api/models/temp-account.models.ts/temp-account-models';
import { TemporaryUserAccount } from '../domain/entities/temp-account.entity';
import { UpdatePasswordDto } from '../api/models/auth-input.models.ts/password-recovery.types';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(UserAccount)
    private readonly userAccounts: Repository<UserAccount>,
    @InjectRepository(TemporaryUserAccount)
    private readonly tempUserAccounts: Repository<TemporaryUserAccount>,
  ) {}

  async createTemporaryUserAccount(
    createDto: CreateTempAccountDto,
  ): Promise<OutputId | null> {
    try {
      const { recoveryCode, expirationDate, email } = createDto;

      const result = await this.tempUserAccounts.insert({
        email: email,
        recovery_code: recoveryCode,
        code_expiration_time: expirationDate,
      });

      return result.raw[0].id;
    } catch (error) {
      console.error(
        `While creating the temp user account occurred some errors: ${error}`,
      );
      return null;
    }
  }

  async findTemporaryAccountByRecoveryCode(
    recoveryCode: string,
  ): Promise<TemporaryUserAccount | null> {
    try {
      const result = await this.tempUserAccounts.findOneBy({
        recovery_code: recoveryCode,
      });

      if (!result) return null;

      return result;
    } catch (error) {
      console.error(
        `While find the temporary account occurred some errors: ${error}`,
      );
      return null;
    }
  }

  async deleteTemporaryUserAccount(recoveryCode: string): Promise<boolean> {
    try {
      const result = await this.tempUserAccounts.delete({
        recovery_code: recoveryCode,
      });

      return result.affected !== 0;
    } catch (error) {
      console.error('Database fails operate with deleting user', error);
      return false;
    }
  }

  async findUserAccountByConfirmationCode(
    confirmationCode: string,
  ): Promise<UserAccount | null> {
    try {
      const currentTime = new Date();

      const result = await this.userAccounts.findOneBy({
        confirmation_code: confirmationCode,
        confirmation_expiration_date: MoreThanOrEqual(currentTime),
      });

      if (!result) return null;

      return result;
    } catch (e) {
      console.error(
        `there were some problems during find user's account by confirmation code, ${e}`,
      );
      return null;
    }
  }

  async findByLoginOrEmail(
    inputData: LoginOrEmailType,
  ): Promise<UserAccount | null> {
    try {
      const { email, login, loginOrEmail } = inputData;

      const conditions: FindOptionsWhere<UserAccount>[] = [
        { email: Equal('' + email) },
        { login: Equal('' + login) },
        { email: Equal('' + loginOrEmail) },
        { login: Equal('' + loginOrEmail) },
      ];

      const result = await this.userAccounts.findOne({ where: conditions });

      if (!result) return null;

      return result;
    } catch (e) {
      console.error(
        `there were some problems during find user by login or email, ${e}`,
      );
      return null;
    }
  }

  async updateConfirmation(id: string): Promise<boolean> {
    try {
      const result = await this.userAccounts.update(
        { id },
        { is_confirmed: true },
      );

      return result.affected !== 0;
    } catch (error) {
      console.error(
        `there were some problems during update user's confirmation code: ${error}`,
      );
      return false;
    }
  }

  async updateConfirmationCode(
    email: string,
    confirmationCode: string,
    newConfirmationExpDate: Date,
  ): Promise<boolean> {
    try {
      const result = await this.userAccounts.update(
        { email },
        {
          confirmation_code: confirmationCode,
          confirmation_expiration_date: newConfirmationExpDate,
        },
      );

      return result.affected !== 0;
    } catch (error) {
      console.error(
        `Database fails operate during update confirmation code operation ${error}`,
      );
      return false;
    }
  }

  async updateRecoveryCode(
    email: string,
    recoveryData: UserRecoveryType,
  ): Promise<boolean> {
    try {
      const result = await this.userAccounts.update(
        { email: email },
        {
          password_recovery_code: recoveryData.recoveryCode,
          password_recovery_expiration_date: recoveryData.expirationDate,
        },
      );

      return result.affected !== 0;
    } catch (error) {
      console.error(
        `Database fails operate during update recovery code operation ${error}`,
      );
      return false;
    }
  }

  async updateUserPassword(updateData: UpdatePasswordDto): Promise<boolean> {
    try {
      const { passwordHash, passwordSalt, recoveryCode } = updateData;

      const result = await this.userAccounts.update(
        { password_recovery_code: recoveryCode },
        {
          password_recovery_code: '',
          password_recovery_expiration_date: '',
          password_hash: passwordHash,
          password_salt: passwordSalt,
        },
      );

      return result.affected !== 0;
    } catch (error) {
      console.error(
        `Database fails operate with update user password ${error}`,
      );
      return false;
    }
  }
}
