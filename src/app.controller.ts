import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import config from './settings/config/configuration';
import { DataSource } from 'typeorm';
import { seedAllData } from './infra/utils/seed-data';
import { ConfigurationType } from './settings/config/configuration';
import { Request } from 'express';
import { GoogleOauthGuard } from './features/auth/infrastructure/guards/google-oauth.guard';
import { GithubOauthGuard } from './features/auth/infrastructure/guards/github-oauth.guard';
import { writeLogAsync } from './infra/utils/fs-utils';

@Controller('app')
export class AppController {
  constructor(
    private readonly configService: ConfigService<ConfigurationType>,
    private readonly dataSource: DataSource,
  ) {}

  @Get('google/login')
  @UseGuards(GoogleOauthGuard)
  handleLogin() {
    return { msg: 'Google Authentication' };
  }

  @Get('google/redirect')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req: Request) {
    const user = req.user;
    console.log({ user });

    if (!user) {
      return { message: 'Authentication failed' };
    }
    return { message: 'Authentication successful', user: user };
  }

  @Get('github/callback')
  @UseGuards(GithubOauthGuard)
  handleGithubCallback(req: Request) {
    return { msg: 'OK', user: req?.user };
  }

  @Get('github/login')
  @UseGuards(GithubOauthGuard)
  async handleGithubLogin() {}

  @Get('config')
  getConfig() {
    const env = this.configService.get('env');
    const jwt = this.configService.get('jwtSettings');
    const basic = this.configService.get('basicAuth', { infer: true });
    console.log(process.env.TEST_ENV);

    const environmentConfig = config();
    // console.log({ env, jwt, basic, environmentConfig });
    return environmentConfig;
  }

  @Post()
  async seedData() {
    await seedAllData(this.dataSource);
  }

  @Get('test/:appId/:testId')
  async testApi(
    @Param('appId') appId: string,
    @Param('testId') testId: string,
    @Query() queryParams: string[],
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const params = req.params;
    const query = req.query;
    console.log({ params, query, queryParams });

    // console.log({ appId, testId });
  }

  @Get()
  async sayHello() {
    return 'Hello World!';
  }
}
