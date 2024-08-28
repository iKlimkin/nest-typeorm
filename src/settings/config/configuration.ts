const getConfig = (
  environmentVariables: EnvironmentVariable,
  currentEnvironment: Environments,
) => ({
  port: parseInt(environmentVariables.PORT ?? '5000'),
  jwtSettings: {
    ACCESS_TOKEN_SECRET: environmentVariables.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: environmentVariables.REFRESH_TOKEN_SECRET,
  },
  basicAuth: {
    USERNAME: environmentVariables.BASIC_AUTH_USERNAME,
    PASSWORD: environmentVariables.BASIC_AUTH_PASSWORD,
  },
  emailSettings: {
    EMAIL_PASSWORD: environmentVariables.EMAIL_PASSWORD,
    EMAIL_USER: environmentVariables.EMAIL_USER,
    EMAIL_SERVICE: environmentVariables.EMAIL_SERVICE,
  },
  pg: {
    url: environmentVariables.DATABASE_URL,
    remoteUrl: environmentVariables.DATABASE_REMOTE_URL,
    database: environmentVariables.DATABASE_NAME,
    studyDbName: environmentVariables.studyDbName,
    port: environmentVariables.POSTGRES_PORT,
    username: environmentVariables.POSTGRES_USER,
    password: environmentVariables.POSTGRES_PASSWORD,
    type: environmentVariables.MAIN_DB as 'postgres' | 'mongodb' | 'mysql',
  },
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
    bucketName: process.env.AWS_BUCKET_NAME,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  },
  telegram: {
    token: process.env.TELEGRAM_TOKEN,
    botForTestsToken: process.env.TG_BOT_FOR_TESTS_TOKEN,
  },
  stripe: {
    success_url: process.env.STRIPE_SUCCESS_URL,
    cancel_url: process.env.STRIPE_CANCEL_URL,
    api_key: process.env.STRIPE_API_KEY,
    secret: process.env.STRIPE_SECRET,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  google: {
    capture_secret: process.env.GOOGLE_CAPTURE_SECRET,
    site_key: process.env.CAPTURE_SITE_KEY,
    client_id: process.env.OAUTH_GOOGLE_CLIENT_ID,
    client_secret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    redirect_url: process.env.OAUTH_GOOGLE_REDIRECT_URL,
  },
  github: {
    client_id: process.env.OAUTH_GITHUB_CLIENT_ID,
    client_secret: process.env.OAUTH_GITHUB_CLIENT_SECRET,
    redirect_url: process.env.OAUTH_GITHUB_REDIRECT_URL,
  },
  env: currentEnvironment,
});

export type ConfigurationType = ReturnType<typeof getConfig>;

export type PgConnectionType = ConfigurationType['pg'];

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
  const currentEnvironment = environmentVariables.ENV as Environments;

  return getConfig(environmentVariables, currentEnvironment);
};
