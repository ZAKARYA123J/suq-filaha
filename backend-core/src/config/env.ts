import type { StringValue } from 'ms';

const jwtExpiration = (process.env.JWT_EXPIRATION ?? '7d') as StringValue;

interface Config {
  jwtSecret: string;
  jwtExpiration: StringValue | number;
      port:string | number
    nodeEnv:string
    phoenixUrl:string
    phoenixApiKey:string
}

export const config:Config = {
  port: process.env.PORT || 3000,
   jwtSecret: process.env.JWT_SECRET as string || "your-super-secret-key-here-make-it-long-and-random",
jwtExpiration,  nodeEnv: process.env.NODE_ENV || 'development',
  phoenixUrl: process.env.PHOENIX_URL || 'http://localhost:4000',
  phoenixApiKey: process.env.PHOENIX_API_KEY || 'internal-service-key',
};