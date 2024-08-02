import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LayerNoticeInterceptor } from '../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { FilesStorageAdapterTest } from '../services/adapters/files-storage-adapter-test';

export class SaveFileCommand {
  constructor(
    public userId: string,
    public originalName: string,
    public buffer: Buffer,
  ) {}
}

@CommandHandler(SaveFileCommand)
export class SaveUserFileUseCase implements ICommandHandler<SaveFileCommand> {
  constructor(private filesAdapter: FilesStorageAdapterTest) {}

  async execute(
    command: SaveFileCommand,
  ): Promise<LayerNoticeInterceptor | null> {
    const notice = new LayerNoticeInterceptor();
    const { buffer, originalName, userId } = command;

    // const user = repo.getUserProfile(userId)
    const result = await this.filesAdapter.saveFile(userId, buffer);
    // user.updateAvatar(result.url, result.id)
    // repo.save(user)
    return notice;
  }
}

export type SaveFileResultType = {
  url: string;
  id: string;
};
