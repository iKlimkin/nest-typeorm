import { Injectable } from '@nestjs/common';
import { QuizQueryRepo } from '../../api/models/query-repositories/quiz.query.repo';
import { QuizRepository } from '../../infrastructure/quiz-game.repo';
import { UsersRepository } from '../../../admin/infrastructure/users.repo';
import { UserSessionDto } from '../../../security/api/models/security-input.models/security-session-info.model';

@Injectable()
export class QuizTestService {
  constructor(
    private readonly quizQueryRepo: QuizQueryRepo,
    private readonly quizRepository: QuizRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async testComprehension(userInfo: UserSessionDto) {
    const { userId } = userInfo;
    const user = await this.usersRepo.getUserById(userId);

    // return this.quizQueryRepo.test(user);
  }
}
