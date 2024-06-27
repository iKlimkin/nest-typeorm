import { answerLength } from '../../../../../domain/validation.constants';
import { iSValidField } from '../../../../../infra/decorators/transform/transform-params';

export class InputAnswerModel {
  @iSValidField(answerLength)
  answer: string;
}
