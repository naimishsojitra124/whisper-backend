import nodemailer, { TransportOptions } from "nodemailer";
import { google } from "googleapis";
import { FastifyInstance } from "fastify";

export async function createTransporter(fastify: FastifyInstance) {
  const oAuth2Client = new google.auth.OAuth2(
    fastify.config.GOOGLE_CLIENT_ID,
    fastify.config.GOOGLE_CLIENT_SECRET,
    fastify.config.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: fastify.config.GOOGLE_REFRESH_TOKEN,
  });
  const accessToken = await oAuth2Client.getAccessToken();

  if (!accessToken?.token) {
    throw new Error("Failed to generate Google access token");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: fastify.config.EMAIL_ID,
      clientId: fastify.config.GOOGLE_CLIENT_ID,
      clientSecret: fastify.config.GOOGLE_CLIENT_SECRET,
      refreshToken: fastify.config.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken,
    },
  } as TransportOptions);
}
