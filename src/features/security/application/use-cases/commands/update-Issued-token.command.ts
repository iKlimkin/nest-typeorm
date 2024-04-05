export class UpdateIssuedTokenCommand {
  constructor(
    public deviceId: string,
    public issuedAt: Date,
    public expirationDate: Date,
  ) {}
}
