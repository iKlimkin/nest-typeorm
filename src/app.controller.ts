import { Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import config from './settings/config/configuration';
import { DataSource } from 'typeorm';
import { seedAllData } from './infra/utils/seed-data';
import { ConfigurationType } from './settings/config/configuration';

@Controller('app')
export class AppController {
  constructor(
    private readonly configService: ConfigService<ConfigurationType>,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getConfig() {
    const env = this.configService.get('env');
    const jwt = this.configService.get('jwtSettings');
    const basic = this.configService.get('basicAuth', { infer: true });

    const environmentConfig = config();
    console.log({ env, jwt, basic, environmentConfig });
    return environmentConfig
  }

  @Post()
  async seedData() {
    await seedAllData(this.dataSource);
  }
}
