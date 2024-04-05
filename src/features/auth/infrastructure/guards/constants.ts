export const jwtConstants = {
  jwt_access_secret: process.env.ACCESS_TOKEN_SECRET || 'jwt_access_secret_key',
  jwt_refresh_secret:
    process.env.REFRESH_TOKEN_SECRET || 'jwt_refresh_secret_KEY',
};

export const basicConstants = {
  userName: process.env.HTTP_BASIC_USER || 'admin',
  userPassword: process.env.HTTP_BASIC_PASS || 'qwerty',
};
