export class JoinTheMembershipPlanCommand {
  constructor(
    public userId: string,
    public membershipPlanId: string,
    public blogId: string,
  ) {}
}
