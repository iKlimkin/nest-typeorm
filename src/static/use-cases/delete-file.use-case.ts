import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LayerNoticeInterceptor } from '../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { FilesStorageAdapterTest } from '../services/adapters/files-storage-adapter-test';

export class DeleteFileCommand {
  constructor(public userId: string) {}
}

@CommandHandler(DeleteFileCommand)
export class DeleteUserFileUseCase
  implements ICommandHandler<DeleteFileCommand>
{
  constructor(private filesAdapter: FilesStorageAdapterTest) {}

  async execute(
    command: DeleteFileCommand,
  ): Promise<LayerNoticeInterceptor | null> {
    const notice = new LayerNoticeInterceptor();
    const { userId } = command;
    // const fileId = userRepo.getUserProfile(userId)
    const fileId = `content/users/${userId}/avatars/${userId}.png`;
    // const user = repo.getUserProfile(userId)
    const result = await this.filesAdapter.deleteFile(fileId);
    console.log({ result });

    // user.updateAvatar(result.url, result.id)
    // repo.save(user)
    return notice;
  }
}
