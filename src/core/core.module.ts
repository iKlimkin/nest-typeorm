import { Global, Module } from '@nestjs/common';
import { EmailManager } from '../infra/managers/email-manager';
import { EmailAdapter } from '../infra/adapters/email.adapter';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [EmailManager, EmailAdapter],
  exports: [EmailManager, EmailAdapter],
})
export class CoreModule {}
