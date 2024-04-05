import { CreateUserDto } from "../../api/models/create-user.model";

export class CreateSACommand {
  constructor(public createData: CreateUserDto) {}
}
