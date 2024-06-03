import { createUser } from './quizRepoMock';

export class MockUserRepo {
  async getUserById(userId: string) {
    const user = createUser();
    return Promise.resolve(user);
  }
}
