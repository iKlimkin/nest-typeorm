export type LoginCredentials = {
  loginOrEmail: string;
  password: string;
};

export type LoginOrEmailType = {
  login?: string;
  email?: string;
  loginOrEmail?: string;
};

export type AuthUserType = {
  id?: string;
  login: string;
  email: string;
  password: string;
};
