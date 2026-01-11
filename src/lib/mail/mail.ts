import { render } from "@react-email/render";
import { createTransporter } from "./transporter";
import VerifyAccountEmail from "./templates/VerifyAccountEmail";
import NewDeviceLoginEmail from "./templates/NewDeviceLoginEmail";
import { FastifyInstance } from "fastify";
import PasswordChangedEmail from "./templates/PasswordChangedEmail";
import EmailChangeNotificationEmail from "./templates/EmailChangeNotificationEmail";
import TwoFactorOtpEmail from "./templates/TwoFactorOtpEmail";
import TwoFactorEnabledEmail from "./templates/TwoFactorEnabledEmail";

// Verify account email
interface SendVerificationEmailProps {
  email: string;
  displayName: string;
  token: string;
  purpose: "register" | "change-email";
}

export const sendVerificationEmail = async (
  fastify: FastifyInstance,
  { email, displayName, token, purpose }: SendVerificationEmailProps
) => {
  const MAIL_FROM_NAME = fastify.config.MAIL_FROM_NAME;
  const EMAIL_ID = fastify.config.EMAIL_ID;
  const HOST = fastify.config.HOST || "http://localhost:3000";

  // Create Transporter
  const transporter = await createTransporter(fastify);

  //Create verification link
  const verificationLink =
    purpose === "change-email"
      ? `${HOST}/user/verify-email-change?token=${token}`
      : `${HOST}/auth/verify-email?token=${token}`;

  if (!token) {
    return {
      error: "Error generating verification token",
    };
  }

  const subject =
    purpose === "change-email"
      ? "Confirm your new Whisper email address"
      : "Verify your Whisper email address";

  const text =
    purpose === "change-email"
      ? `
You requested to change your Whisper account email.

Confirm your new email address by opening the link below:
${verificationLink}

This link expires in 10 minutes.
If you did not request this change, secure your account immediately.
`
      : `
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
      purpose,
    })
  );

  // Send email
  transporter.sendMail({
    from: `${MAIL_FROM_NAME} ${EMAIL_ID}`,
    to: email,
    subject,
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

// Change Password email
interface sendPasswordChangedEmailProps {
  email: string;
  userName: string;
  ip: string;
  device: string;
  location: string;
  time: string;
}

export const sendPasswordChangedEmail = async (
  fastify: FastifyInstance,
  { email, userName, ip, device, location, time }: sendPasswordChangedEmailProps
) => {
  const MAIL_FROM_NAME = fastify.config.MAIL_FROM_NAME;
  const EMAIL_ID = fastify.config.EMAIL_ID;

  // Create Transporter
  const transporter = await createTransporter(fastify);

  const text = `
Your Whisper password was changed

Hello,

This is a security notification to let you know that the password for your Whisper account was changed successfully.

Time: ${time}
IP address: ${ip}
Device: ${device}
Location: ${location}

If you made this change, no further action is required.

If you did NOT change your password, your account may be compromised.
Please reset your password immediately using the "Forgot password" option and contact Whisper support.

Stay secure,
Whisper Security Team
`;

  // Create email
  const emailHtml = await render(
    PasswordChangedEmail(fastify, {
      userName,
      time: time,
      ip,
      device,
      location,
    })
  );

  // Send email
  transporter.sendMail({
    from: `${MAIL_FROM_NAME} ${EMAIL_ID}`,
    to: email,
    subject: "Your Whisper password was changed",
    text,
    html: emailHtml,
  });
};

// Change Email
interface SendEmailChangeNotificationParams {
  displayName: string;
  oldEmail: string;
  newEmail: string;
  time: string;
  ip: string;
  device: string;
  location: string;
}

export const sendEmailChangeNotification = async (
  fastify: FastifyInstance,
  {
    displayName,
    oldEmail,
    newEmail,
    time,
    ip,
    device,
    location,
  }: SendEmailChangeNotificationParams
) => {
  const MAIL_FROM_NAME = fastify.config.MAIL_FROM_NAME;
  const EMAIL_ID = fastify.config.EMAIL_ID;

  const transporter = await createTransporter(fastify);

  const text = `
Your Whisper account email change was requested.

New email: ${newEmail}
Time: ${time}
Device: ${device}
IP address: ${ip}
Location: ${location}

If this was you, no action is needed.
If this was NOT you, change your password immediately and contact support.
`;

  // Create email
  const emailHtml = await render(
    EmailChangeNotificationEmail(fastify, {
      displayName,
      newEmail,
      time,
      ip,
      device,
      location,
    })
  );

  await transporter.sendMail({
    from: `${MAIL_FROM_NAME} ${EMAIL_ID}`,
    to: oldEmail,
    subject: "Whisper security alert: Email change requested",
    text,
    html: emailHtml,
  });
};

// 2FA OTP
interface SendTwoFactorOtpEmailParams {
  email: string;
  userName: string;
  otp: string;
}
export const sendTwoFactorOtpEmail = async (
  fastify: FastifyInstance,
  { email, userName, otp }: SendTwoFactorOtpEmailParams
) => {
  const MAIL_FROM_NAME = fastify.config.MAIL_FROM_NAME;
  const EMAIL_ID = fastify.config.EMAIL_ID;

  const transporter = await createTransporter(fastify);

  const text = `
Your Whisper verification code is ${otp}. It expires in 10 minutes.`;

  // Create email
  const emailHtml = await render(TwoFactorOtpEmail(fastify, { userName, otp }));

  await transporter.sendMail({
    from: `${MAIL_FROM_NAME} ${EMAIL_ID}`,
    to: email,
    subject: `Your Whisper MFA Code is ${otp}`,
    text,
    html: emailHtml,
  });
};

// Enable 2FA

interface SendTwoFactorEnabledEmailParams {
  email: string;
  userName: string;
  time: string;
  ip: string;
  device: string;
}
export const sendTwoFactorEnabledEmail = async (
  fastify: FastifyInstance,
  { email, userName, time, ip, device }: SendTwoFactorEnabledEmailParams
) => {
  const MAIL_FROM_NAME = fastify.config.MAIL_FROM_NAME;
  const EMAIL_ID = fastify.config.EMAIL_ID;

  const transporter = await createTransporter(fastify);

  const text = `
Two-factor authentication enabled

Hi ${userName},

Two-factor authentication has been enabled on your Whisper account.

Time: ${time}
Device: ${device}
IP address: ${ip}

If this was not you, secure your account immediately.
`;

  // Create email
  const emailHtml = await render(TwoFactorEnabledEmail(fastify, { userName,
      time,
      ip,
      device, }));

  await transporter.sendMail({
    from: `${MAIL_FROM_NAME} ${EMAIL_ID}`,
    to: email,
    subject: `Whisper security alert: Two-factor authentication enabled`,
    text,
    html: emailHtml,
  });
};
