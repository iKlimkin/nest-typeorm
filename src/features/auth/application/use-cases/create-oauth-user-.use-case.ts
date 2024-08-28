// import {
//   CommandBus,
//   CommandHandler,
//   EventBus,
//   ICommandHandler,
// } from '@nestjs/cqrs';
// import { LayerNoticeInterceptor } from '../../../../../core/utils/notification';
// import { UserProviderDTO } from '../../../admin/application/dto/create-user.dto';
// import { UsersRepository } from '../../../admin/infrastructure/users.repo';
// import { CreateSessionCommand } from '../../../security/application/use-cases/commands/create-session.command';
// import { JwtTokens } from '../../api/models/auth-input.models.ts/jwt.types';
// import {
//   IGithubUserInput,
//   IGoogleUserInput,
// } from '../../api/models/auth-input.models.ts/provider-user-info';
// import { AuthRepository } from '../../infrastructure/auth.repository';
// import { EmailNotificationOauthEvent } from './events/email-notification-oauth-event';
// import { Provider, UserAccount } from '@prisma/client';

// export class CreateOAuthUserCommand {
//   constructor(public createDto: IGoogleUserInput | IGithubUserInput) {}
// }

// @CommandHandler(CreateOAuthUserCommand)
// export class CreateOAuthUserUseCase
//   implements ICommandHandler<CreateOAuthUserCommand>
// {
//   private location = this.constructor.name;
//   constructor(
//     private usersRepo: UsersRepository,
//     private authRepo: AuthRepository,
//     private eventBus: EventBus,
//     private commandBus: CommandBus
//   ) {}

//   async execute(
//     command: CreateOAuthUserCommand
//   ): Promise<LayerNoticeInterceptor<JwtTokens>> {
//     const { email, providerId, provider } = command.createDto;
//     const notice = new LayerNoticeInterceptor<JwtTokens>();

//     const existedUser = await this.authRepo.findUserByEmailOrProviderId(
//       email,
//       providerId
//     );

//     if (existedUser) {
//       const command = new CreateSessionCommand({ userId: existedUser.id });
//       const { accessToken, refreshToken } =
//         await this.commandBus.execute(command);

//       if (existedUser.provider) {
//         notice.addData({ accessToken, refreshToken });
//       } else if (!existedUser.provider) {
//         await this.authRepo.addProviderInfoToUser(
//           existedUser.id,
//           provider,
//           providerId
//         );
//       }
//       notice.addData({ accessToken, refreshToken });
//       return notice;
//     }

//     const userDto = new UserProviderDTO(command);
//     const savedUser = await this.usersRepo.save(userDto);
//     const { accessToken, refreshToken } = await this.commandBus.execute(
//       new CreateSessionCommand({ userId: savedUser.id })
//     );

//     this.eventBus.publish(
//       new EmailNotificationOauthEvent(email, savedUser.userName)
//     );
//     notice.addData({ accessToken, refreshToken });
//     return notice;
//   }

//   private async handleExistingUser(
//     user: UserAccount,
//     provider: Provider,
//     providerId: string,
//     notice: LayerNoticeInterceptor<JwtTokens>
//   ): Promise<LayerNoticeInterceptor<JwtTokens>> {
//     const command = new CreateSessionCommand({ userId: user.id });
//     const { accessToken, refreshToken } =
//       await this.commandBus.execute(command);

//     if (!user.provider) {
//       await this.authRepo.addProviderInfoToUser(user.id, provider, providerId);
//     }

//     notice.addData({ accessToken, refreshToken });
//     return notice;
//   }

//   private async handleNewUser(
//     command: CreateOAuthUserCommand,
//     notice: LayerNoticeInterceptor<JwtTokens>
//   ): Promise<LayerNoticeInterceptor<JwtTokens>> {
//     const userDto = new UserProviderDTO(command);
//     const savedUser = await this.usersRepo.save(userDto);
//     const { accessToken, refreshToken } = await this.commandBus.execute(
//       new CreateSessionCommand({ userId: savedUser.id })
//     );

//     this.eventBus.publish(
//       new EmailNotificationOauthEvent(savedUser.email, savedUser.userName)
//     );
//     notice.addData({ accessToken, refreshToken });
//     return notice;
//   }
// }
