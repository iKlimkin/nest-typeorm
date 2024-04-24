import { answerLength } from '../../../../../domain/validation.constants';
import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-field';

export class InputAnswerModel {
  @iSValidField(answerLength)
  answer: string;
}
