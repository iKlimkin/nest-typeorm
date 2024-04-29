import { Injectable } from '@nestjs/common';
import { QuizRepository } from '../infrastructure/quiz-game.repo';
import { QuizQueryRepo } from '../api/models/query-repositories/quiz.query.repo';
import { UserSessionDto } from '../../security/api';
import { UsersRepository } from '../../admin/infrastructure/users.repo';


@Injectable()
export class QuizService {
  constructor(
    private readonly quizQueryRepo: QuizQueryRepo,
    private readonly quizRepository: QuizRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async testComprehension(userInfo: UserSessionDto) {
    const { userId } = userInfo
    const user = await this.usersRepo.getUserById(userId);
    
    return this.quizQueryRepo.test(user)
  }
}
