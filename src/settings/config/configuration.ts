const getConfig = (
  environmentVariables: EnvironmentVariable,
  currentEnvironment: Environments,
) => ({
  Port: parseInt(process.env.PORT ?? '5000'),
  jwtSetting: {
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  },
  emailSettings: {
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  },
  authBasic: {
    HTTP_BASIC_USER: process.env.HTTP_BASIC_USER,
    HTTP_BASIC_PASS: process.env.HTTP_BASIC_PASS,
  },
  pg: {
    name: 'postgres',
    url: process.env.DATABASE_URL,
    host: 'postgres',
    db_name: 'nest-typeorm',
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

export type ConfigType = ConfigurationType & {
  MONGO_URI: string;
  MONGO_URI2: string;
  NODE_ENV: 'production' | 'development' | 'stage';
};

export default () => {
  const environmentVariables = process.env;

  console.log('process.env.ENV =', environmentVariables.ENV);
  const currentEnvironment: Environments =
    environmentVariables.ENV as Environments;

  return getConfig(environmentVariables, currentEnvironment);
};
