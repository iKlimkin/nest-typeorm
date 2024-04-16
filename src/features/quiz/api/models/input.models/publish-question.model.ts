import { IsBoolean, IsNotEmpty } from 'class-validator';

export class InputPublishData {
  /**
   * "Published" indicates that the question is complete and can be 
   * used in a quiz game.
   */
  @IsNotEmpty()
  @IsBoolean()
  published: boolean;
}
