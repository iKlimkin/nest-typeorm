import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ValidationError, validateOrReject } from 'class-validator';
import { Strategy } from 'passport-local';
import { UserIdType } from '../../../../admin/api/models/outputSA.models.ts/user-models';
import { CommandBus } from '@nestjs/cqrs';
import { PassportStrategy } from '@nestjs/passport';
import { VerificationCredentialsCommand } from '../../../application/use-cases/commands/verification-credentials.command';
import { LayerNoticeInterceptor } from '../../../../../infra/utils/interlay-error-handler.ts/error-layer-interceptor';
import { UserCredentialsDto } from '../../../api/models/auth-input.models.ts/input-credentials.model';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private commandBus: CommandBus) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  async validate(loginOrEmail: string, password: string): Promise<UserIdType> {
    await this.validateInputModel(loginOrEmail, password);

    const command = new VerificationCredentialsCommand({
      loginOrEmail,
      password,
    });

    const result = await this.commandBus.execute<
      VerificationCredentialsCommand,
      LayerNoticeInterceptor<UserIdType | null>
    >(command);

    if (!result) throw new UnauthorizedException();

    return result.data;
  }

  private async validateInputModel(loginOrEmail: string, password: string) {
    const validation = new UserCredentialsDto();
    validation.loginOrEmail = loginOrEmail;
    validation.password = password;
    try {
      await validateOrReject(validation);
    } catch (errors) {
      await this.handleValidationErrors(errors);
    }
  }

  private async handleValidationErrors(
    errors: ValidationError[],
  ): Promise<void> {
    const errorResponse: any = {
      message: [],
    };

    for (const error of errors) {
      const constraints = Object.values(error.constraints || {});

      for (const constraint of constraints) {
        errorResponse.message.push({
          field: error.property,
          message: constraint.trim(),
        });
      }
    }
    throw new BadRequestException(errorResponse);
  }
}
