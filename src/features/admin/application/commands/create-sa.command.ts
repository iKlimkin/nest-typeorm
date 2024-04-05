import { InputUserModel } from '../../api/models/create-user.model';

export class CreateSACommand {
  constructor(public saDTO: InputUserModel) {}
}
