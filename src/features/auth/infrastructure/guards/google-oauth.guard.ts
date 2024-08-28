import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyType } from '../../../../infra/enum/strategy.enum';

@Injectable()
export class GoogleOauthGuard extends AuthGuard(StrategyType.Google) {
  // async canActivate(context: ExecutionContext): Promise<boolean> {
  //   const activate = await super.canActivate(context);
  //   const request = context.switchToHttp().getRequest();
  //   await super.logIn(request);
  //   return activate as boolean;
  // }
  constructor() {
    super({
      accessType: 'offline',
    });
  }
}
