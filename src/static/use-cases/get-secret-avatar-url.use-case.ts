import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LayerNoticeInterceptor } from '../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { FilesStorageAdapterTest } from '../services/adapters/files-storage-adapter-test';

export class GetSecretAvatarUrlCommand {
  constructor(
    public userId: string,
    public paymentId: string,
  ) {}
}

@CommandHandler(GetSecretAvatarUrlCommand)
export class GetSecretAvatarUrlUseCase
  implements ICommandHandler<GetSecretAvatarUrlCommand>
{
  constructor(private filesAdapter: FilesStorageAdapterTest) {}

  async execute(
    command: GetSecretAvatarUrlCommand,
  ): Promise<LayerNoticeInterceptor<string>> {
    const notice = new LayerNoticeInterceptor<string>();
    const { userId, paymentId } = command;
    const fileId = `content/users/${userId}/avatars/${userId}.png`;
    const result = await this.filesAdapter.getSecretUrl(fileId);
    notice.addData(result);
    return notice;
  }
}
