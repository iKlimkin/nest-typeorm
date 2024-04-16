import { UpdateQuestionData } from '../../api/models/input.models/update-question.model';

export class UpdateQuestionCommand {
  constructor(
    public readonly updateData: UpdateQuestionData & {
      published: boolean;
      questionId: string;
    }
  ) {}
}
