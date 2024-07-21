import { CreateUserDto } from '../../api/models/input-sa.dtos.ts/create-user.model';

export class CreateSACommand {
  constructor(public createData: CreateUserDto) {}
}
