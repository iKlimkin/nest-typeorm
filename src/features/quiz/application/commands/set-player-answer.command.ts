import { UserIdType } from '../../../admin/api/models/outputSA.models.ts/user-models';
import { InputAnswerModel } from '../../api/models/input.models/answer.model';

export class SetPlayerAnswerCommand {
  constructor(public readonly inputData: InputAnswerModel & UserIdType) {}
}
