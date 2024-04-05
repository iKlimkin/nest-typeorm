export class EmailNotificationEvent {
  constructor(
    public email: string,
    public confirmationCode: string,
  ) {}
}
