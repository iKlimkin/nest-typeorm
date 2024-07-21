import { RouterPathsType } from '../helpers/routing';

export class SAUsersRouting {
  constructor(private readonly baseUrl: RouterPathsType) {}
  getUsers = () => this.baseUrl;
  createSA = () => this.baseUrl;
  banUnbanRestriction = (userId: string) => `${this.baseUrl}/${userId}/ban`;
  deleteSA = (userId: string) => `${this.baseUrl}/${userId}`;
}
