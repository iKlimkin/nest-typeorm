import { CreateUserDto } from '../../../api/models/auth-input.models.ts/user-registration.model';

export class CreateUserAccountEvent {
  constructor(public userDto: CreateUserDto) {}
}
