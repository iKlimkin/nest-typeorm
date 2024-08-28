import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DeleteFileCommand } from './use-cases/delete-file.use-case';
import { GetSecretAvatarUrlCommand } from './use-cases/get-secret-avatar-url.use-case';
import { SaveFileCommand } from './use-cases/save-file.use-case';

@Controller('avatars')
export class FilesController {
  constructor(private commandBus: CommandBus) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any) {
    // return this.avatarService.uploadAvatar(file);
  }

  @Get()
  @UseInterceptors(FileInterceptor('file'))
  async changeAvatar(@UploadedFile() file: any, @Res() res: Response) {
    return res.redirect('/change-page.html');
  }

  @Post()
  // @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('file'))
  async createAvatar(
    // @CurrentUserInfo() userInfo: UserSessionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const command = new SaveFileCommand('123', file.originalname, file.buffer);
    await this.commandBus.execute(command);
    return 'success';
  }

  @Get('delete')
  async deleteAvatar(userId: string = '123') {
    const command = new DeleteFileCommand(userId);
    await this.commandBus.execute(command);
  }

  @Get('getSecret')
  async getSecret(userId: string = '123') {
    const paymentId = '10';
    const command = new GetSecretAvatarUrlCommand(userId, paymentId);
    const notice = await this.commandBus.execute(command);
    return notice.data;
  }
}
