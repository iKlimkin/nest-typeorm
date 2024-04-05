import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostsSqlRepository } from '../../infrastructure/posts.sql-repository';
import { DeletePostSqlCommand } from './commands/delete-post-sql.command';
import { PostsTorRepo } from '../../infrastructure/posts.repository';

@CommandHandler(DeletePostSqlCommand)
export class DeletePostSqlUseCase
  implements ICommandHandler<DeletePostSqlCommand>
{
  constructor(
    private postsSqlRepository: PostsSqlRepository,
    private postsRepo: PostsTorRepo,
  ) {}

  async execute(command: DeletePostSqlCommand): Promise<void> {
    this.postsRepo.deletePost(command.postId);
  }
}
