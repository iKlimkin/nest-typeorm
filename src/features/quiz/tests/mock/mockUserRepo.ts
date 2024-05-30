import { UserAccount } from '../../../auth/infrastructure/settings';

export class MockUserRepo {
  async getUserById(userId: string) {
    const user = createUser();
    return Promise.resolve(user);
  }
}

export const createUser = (): UserAccount =>
  ({
    id: '75442486-0878-440c-9db1-a7006c25a39f',
    email: 'email',
    login: 'login0',
    password_hash: 'hash',
    password_salt: 'salt',
    is_confirmed: true,
    created_at: new Date(),
  }) as UserAccount;
