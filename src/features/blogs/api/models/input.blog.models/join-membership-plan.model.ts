import { IsString } from 'class-validator';

export class JoinTheMembershipPlanInput {
  @IsString()
  membershipPlanId: string;
}
