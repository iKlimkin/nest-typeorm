const getConfig = (
  environmentVariables: EnvironmentVariable,
  currentEnvironment: Environments
) => ({
  Port: parseInt(process.env.PORT ?? '5000'),
  jwtSettings: {
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  },
  basicAuth: {
    USERNAME: process.env.BASIC_AUTH_USERNAME,
    PASSWORD: process.env.BASIC_AUTH_PASSWORD,
  },
  emailSettings: {
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  },
  pg: {
    url: process.env.DATABASE_URL,
    typeormPostgresDbName: process.env.typeormPostgresDbName,
    studyDbName: process.env.studyDbName,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  },
  env: {
    currentEnvironment: process.env.ENV,
  },
});

export type ConfigurationType = ReturnType<typeof getConfig>;

export enum Environments {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
  TESTING = 'TESTING',
}

export type EnvironmentVariable = { [key: string]: string | undefined };
export type EnvironmentTypes = keyof typeof Environments;

export default () => {
  const environmentVariables = process.env;
  
  console.log('process.env.ENV =', environmentVariables.ENV);
  const currentEnvironment: Environments =
    environmentVariables.ENV as Environments;

  return getConfig(environmentVariables, currentEnvironment);
};
