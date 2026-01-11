import fp from "fastify-plugin";
import fastifyEnv from "@fastify/env";

const schema = {
  type: "object",
  required: [
    "MONGO_URI",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_REFRESH_TOKEN",
    "EMAIL_ID",
  ],
  properties: {
    PORT: {
      type: "number",
      default: 5000,
    },
    NODE_ENV: {
      type: "string",
      enum: ["development", "production", "test"],
      default: "development",
    },

    MONGO_URI: {
      type: "string",
    },

    JWT_ACCESS_SECRET: {
      type: "string",
    },
    JWT_REFRESH_SECRET: {
      type: "string",
    },

    ACCESS_TOKEN_EXP: {
      type: "string",
      default: "15m",
    },
    REFRESH_TOKEN_EXP: {
      type: "string",
      default: "7d",
    },

    COOKIE_SECURE: {
      type: "boolean",
      default: false,
    },

    TWO_FACTOR_ENCRYPTION_KEY: {
      type: "string"
    },

    GOOGLE_CLIENT_ID: { type: "string" },
    GOOGLE_CLIENT_SECRET: { type: "string" },
    GOOGLE_REDIRECT_URI: {
      type: "string",
      default: "https://developers.google.com/oauthplayground",
    },
    GOOGLE_REFRESH_TOKEN: { type: "string" },

    EMAIL_ID: { type: "string" },
    HOST: { type: "string" },
    MAIL_FROM_NAME: { type: "string" },
    LOGO_URL: { type: "string" },
  },
} as const;

export default fp(async (fastify) => {
  await fastify.register(fastifyEnv, {
    schema,
    dotenv: process.env.NODE_ENV !== 'production',
  });
});
