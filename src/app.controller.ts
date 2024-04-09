import { Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import getConfig from './settings/config/configuration'
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
  getHello(): void {
      const env = this.configService.get('env', { infer: true })
      const jwt = this.configService.get('jwtSettings', {infer: true})
      const basic = this.configService.get('basicAuth', {infer: true})
      console.log({env});
      console.log({jwt});
      console.log({basic});

      const environmentConfig = getConfig();
      console.log({environmentConfig})
  }

  @Post()
  async seedData() {
    await seedAllData(this.dataSource);
  }
}
