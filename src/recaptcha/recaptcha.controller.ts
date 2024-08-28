import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Res,
} from '@nestjs/common';
import { promises as fsp, createReadStream } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { CaptureAdapter } from '../infra/adapters/capture.adapter';

@Controller('recaptcha')
export class RecaptchaController {
  constructor(private captureAdapter: CaptureAdapter) {}

  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(
      join(process.cwd(), 'src', 'static', 'html', 'recaptcha.html'),
    );
    file.pipe(res);
  }

  @Post('password-recovery')
  async testRecaptcha(@Body() body: any) {
    const isValid = this.captureAdapter.isValid(body.recaptchaVal);
    if (!isValid) {
      throw new BadRequestException();
    } else {
      return 'email sent ' + body;
    }
  }
}
