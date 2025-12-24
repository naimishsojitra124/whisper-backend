import { render } from "@react-email/render";
import { createTransporter } from "./transporter";
import VerifyAccountEmail from "./templates/VerifyAccountEmail";
import NewDeviceLoginEmail from "./templates/NewDeviceLoginEmail";
import { FastifyInstance } from "fastify";

// Verify account email
interface SendVerificationEmailParams {
  email: string;
  displayName: string;
  token: string;
}

export const sendVerificationEmail = async (
  fastify: FastifyInstance,
  { email, displayName, token }: SendVerificationEmailParams
) => {
  const MAIL_FROM_NAME = fastify.config.MAIL_FROM_NAME;
  const EMAIL_ID = fastify.config.EMAIL_ID;
  const HOST = fastify.config.HOST || "http://localhost:3000";

  // Create Transporter
  const transporter = await createTransporter(fastify);

  //Create verification link
  const verificationLink = `${HOST}/auth/verify-email?token=${token}`;

  if (!token) {
    return {
      error: "Error generating verification token",
    };
  }

  const text = `
Welcome to Whisper!

Verify your email address by opening the link below:
${verificationLink}

This link expires in 10 minutes.
If you did not create this account, you can safely ignore this email.
`;

  // Create email
  const emailHtml = await render(
    VerifyAccountEmail(fastify, {
      verificationLink,
      userName: displayName,
    })
  );

  // Send email
  transporter.sendMail({
    from: `${MAIL_FROM_NAME} ${EMAIL_ID}`,
    to: email,
    subject: "Verify your Whisper email address",
    text,
    html: emailHtml,
  });
};

// New Device email
interface SendNewDeviceAlertProps {
  fullName: string;
  email: string;
  device: string;
  location: string;
  ip: string;
  time: Date;
}

export const sendNewDeviceAlert = async (
  fastify: FastifyInstance,
  { fullName, email, device, location, ip, time }: SendNewDeviceAlertProps
) => {
  const MAIL_FROM_NAME = fastify.config.MAIL_FROM_NAME;
  const EMAIL_ID = fastify.config.EMAIL_ID;

  // Create Transporter
  const transporter = await createTransporter(fastify);

  // Create email
  const emailHtml = await render(
    NewDeviceLoginEmail(fastify, {
      name: fullName,
      email,
      device,
      location,
      ip,
      time,
    })
  );

  const text = `
Security alert from Whisper

We detected a sign-in to your Whisper account from a new device.

Account: ${email}
Device: ${device}
Location: ${location}
IP Address: ${ip}
Time: ${time}

If this was you, no action is required.

If you do NOT recognize this activity:
- Change your password immediately
- Review your account activity
- Enable two-factor authentication if it is not already enabled

If you need help, contact us at support@whisper.app

— Whisper Security Team
`;

  // Send email
  transporter.sendMail({
    from: `${MAIL_FROM_NAME} ${EMAIL_ID}`,
    to: email,
    subject: "Security alert: New device signed into your Whisper account",
    text,
    html: emailHtml,
  });
};
