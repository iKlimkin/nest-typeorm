import { CreateUserDto } from '../../../api/models/auth-input.models.ts/user-registration.model';

export class CreateUserCommand {
  constructor(public createDto: CreateUserDto) {}
}
