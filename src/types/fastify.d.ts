import "fastify";
import { PrismaClient } from "../generated/prisma";

declare module "fastify" {
  interface FastifyInstance {
    config: {
      PORT: number;
      NODE_ENV: "development" | "production" | "test";

      MONGO_URI: string;

      JWT_ACCESS_SECRET: string;
      JWT_REFRESH_SECRET: string;

      ACCESS_TOKEN_EXP: string;
      REFRESH_TOKEN_EXP: string;

      COOKIE_SECURE: boolean;
      GOOGLE_CLIENT_ID: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_REDIRECT_URI: string;
      GOOGLE_REFRESH_TOKEN: string;
      EMAIL_ID: string;
      HOST: string;
      MAIL_FROM_NAME: string;
      LOGO_URL: string;
    };
    authenticate: any;
  }
  interface FastifyReply {
    setCookie: (name: string, value: string, options?: any) => FastifyReply;
  }
}
