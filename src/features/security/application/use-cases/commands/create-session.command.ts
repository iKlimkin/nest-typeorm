import { SessionCreationDto } from '../../../api/models/security-input.models/create-session.model';

export class CreateSessionCommand {
  constructor(public inputData: SessionCreationDto) {}
}
