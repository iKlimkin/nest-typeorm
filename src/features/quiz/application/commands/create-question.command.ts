import { CreateQuestionData } from '../../api/models/input.models/create-question.model';

export class CreateQuestionCommand {
  constructor(public readonly createData: CreateQuestionData) {}
}
