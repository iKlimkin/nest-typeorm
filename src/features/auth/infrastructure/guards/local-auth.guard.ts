import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
//     private readonly logger = new Logger(LocalAuthGuard.name);

//   handleRequest(err, user, info) {
//     if (err || !user) {
//       this.logger.error(
//         `${err || 'user not found'}`,
//       );
//       this.logger.error(`${JSON.stringify(info)}`);
//       throw err || new UnauthorizedException();
//     }

//     this.logger.log(`success: ${user.username}`);
//     return user;
//   }
}
