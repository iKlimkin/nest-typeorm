import { RouterPaths } from '../helpers/routing';

export class SAUsersRouting {
  constructor(private readonly baseUrl = RouterPaths.users) {}
  getUsers = () => this.baseUrl;
  createSA = () => this.baseUrl;
  banUnbanRestriction = (userId: string) => `${this.baseUrl}/${userId}/ban`;
  deleteSA = (userId: string) => `${this.baseUrl}/${userId}`;
}
