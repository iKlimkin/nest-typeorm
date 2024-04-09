export class BlogCreationDto {
  constructor(
    public title: string,
    public description: string,
    public websiteUrl: string,
    public isMembership: boolean = false
  ) {}
}

export class BlogSADto extends BlogCreationDto {
  public userId: string;
  // public userLogin: string,
}
