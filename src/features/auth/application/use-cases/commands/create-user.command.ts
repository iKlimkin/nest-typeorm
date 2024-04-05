import { CreateUserDto } from "../../../../admin/api/models/create-user.model";

export class CreateUserCommand {
  constructor(public createDto: CreateUserDto) {}
}
