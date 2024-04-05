import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AccessTokenGuard extends AuthGuard('access-token') {
  private readonly logger = new Logger(AccessTokenGuard.name);

  // handleRequest(err, user, info) {
  //   if (err || !user) {
  //     this.logger.error(
  //       `${err || 'user not found'}`,
  //     );
  //     this.logger.error(`${JSON.stringify(info)}`);
  //     throw err || new UnauthorizedException();
  //   }

  //   this.logger.log(`success: ${user.username}`);
  //   return user;
  // }
}
