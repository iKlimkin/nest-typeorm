import { IsArray } from 'class-validator';
import { questionLength } from '../../../../../domain/validation.constants';
import { iSValidField } from '../../../../../infra/decorators/transform/is-valid-field';
import {
  IsValidAnswers,
  IsValidAnswersConstraint,
} from '../../../../../infra/decorators/validate/is-valid-answers';

export class CreateQuestionData {
  /**
   * question info
   */
  @iSValidField(questionLength)
  body: string;

  /**
   * All variants of possible correct answers for current
   * questions
   */
  @IsArray()
  @IsValidAnswers()
  correctAnswers: string[];
}
