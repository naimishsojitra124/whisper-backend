import bcrypt from "bcryptjs";
import { UserModel } from "../models/User.model";
import { AuthTokenModel } from "../models/AuthToken.model";
import { AuditLogModel } from "../models/AuditLog.model";
import { AuditAction, AuthTokenType } from "../types/enum";
import { validatePassword } from "../utils/validatePassword.util";
import { randomBytes, createHash } from "crypto";
import { lookupGeoIp } from "../lib/geoip/geoip";

import type { RegisterInput } from "../schemas/auth.schema";
import { AUTH_SECURITY } from "../constants/security";
import { DeviceModel } from "../models/Device.model";
import { sendNewDeviceAlert } from "../lib/mail/mail";
import { FastifyInstance } from "fastify";

// Register
export async function registerUser(
  data: RegisterInput,
  context: {
    ip?: string;
    userAgent?: string;
    path?: string;
    method?: string;
  }
) {
  const { username, firstName, lastName, email, password } = data;

  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const existingUser = await UserModel.findOne({ email }).lean();
  if (existingUser) {
    throw new Error("User with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 14);

  const user = await UserModel.create({
    username,
    firstName,
    lastName,
    email,
    password: passwordHash,
  });

  const safeUser = {
    id: user._id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar ?? null,
    emailVerified: user.emailVerified ?? null,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    createdAt: user.createdAt,
  };

  // Generate email verification token
  const rawToken = randomBytes(64).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await AuthTokenModel.create({
    userId: user._id,
    email,
    tokenHash,
    type: AuthTokenType.EMAIL_VERIFY,
    expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 minutes
  });

  await AuditLogModel.create({
    userId: user._id,
    action: AuditAction.EMAIL_VERIFIED,
    ipAddress: context.ip || "127.0.0.0.1",
    userAgent: context.userAgent || "Chrome",
    path: context.path || "/api/auth/register",
    method: context.method || "POST",
    metadata: { action: "register" },
  });

  return {
    user: safeUser,
    verificationToken: rawToken,
  };
}

// Verify Email
export async function verifyEmail(
  rawToken: string,
  context: {
    ip?: string;
    userAgent?: string;
    path?: string;
    method?: string;
  }
) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  const tokenDoc = await AuthTokenModel.findOne({
    tokenHash,
    type: AuthTokenType.EMAIL_VERIFY,
  });

  if (!tokenDoc) {
    throw new Error("Invalid or expired verification link.");
  }

  if (tokenDoc.expiresAt < new Date()) {
    await AuthTokenModel.deleteOne({ _id: tokenDoc._id });
    throw new Error("Verification link has expired.");
  }

  const user = await UserModel.findById(tokenDoc.userId);

  if (!user) {
    // Defensive cleanup
    await AuthTokenModel.deleteOne({ _id: tokenDoc._id });
    throw new Error("Invalid verification request.");
  }

  if (user.emailVerified) {
    // Idempotent behavior (important)
    await AuthTokenModel.deleteOne({ _id: tokenDoc._id });
    return;
  }

  user.emailVerified = new Date();
  await user.save();

  // One-time token: MUST be deleted
  await AuthTokenModel.deleteOne({ _id: tokenDoc._id });

  await AuditLogModel.create({
    userId: user._id,
    action: AuditAction.EMAIL_VERIFIED,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    path: context.path,
    method: context.method,
  });
}

// Login
export async function loginUser(
  fastify: FastifyInstance,
  data: { email: string; password: string },
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const user = await UserModel.findOne({ email: data.email });

  // Always generic error → avoid enumeration
  const invalidError = new Error("Invalid email or password.");

  if (!user) {
    throw invalidError;
  }

  // 1️⃣ Email verification
  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in.");
  }

  // 2️⃣ Account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error("Account temporarily locked. Try again later.");
  }

  // 3️⃣ Password compare
  const passwordMatch = await bcrypt.compare(data.password, user.password);

  if (!passwordMatch) {
    user.loginAttempts += 1;

    if (user.loginAttempts >= AUTH_SECURITY.MAX_LOGIN_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + AUTH_SECURITY.LOCK_TIME_MS);

      await AuditLogModel.create({
        userId: user._id,
        action: AuditAction.ACCOUNT_LOCKED,
        ipAddress: context.ip,
        userAgent: context.userAgent,
      });
    }

    await user.save();

    await AuditLogModel.create({
      userId: user._id,
      action: AuditAction.LOGIN_FAILED,
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });

    throw invalidError;
  }

  // 7️⃣ Refresh token (7 days)
  const rawRefreshToken = randomBytes(64).toString("hex");
  const refreshTokenHash = createHash("sha256")
    .update(rawRefreshToken)
    .digest("hex");

  // 5️⃣ Device tracking
  const existingDevice = await DeviceModel.findOne({
    userId: user._id,
    userAgent: context.userAgent,
    ipAddress: context.ip,
  });

  let isNewDevice = false;
  let newDevice;
  const geo = await lookupGeoIp(context.ip);

  if (!existingDevice) {
    isNewDevice = true;

    newDevice = await DeviceModel.create({
      userId: user._id,
      deviceType: "web",
      userAgent: context.userAgent,
      ipAddress: context.ip,
      geoLocation: geo ?? undefined,
      lastActiveAt: new Date(),
    });
  } else {
    existingDevice.lastActiveAt = new Date();
    if (geo) {
      existingDevice.geoLocation = {
        country: geo.country,
        region: geo.region,
        city: geo.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
    }
    await existingDevice.save();
  }

  // 6️⃣ Send new device email
  if (isNewDevice) {
    await sendNewDeviceAlert(fastify, {
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      device: context.userAgent ?? "Unknown device",
      location: geo
        ? `${geo.city ?? geo.region ?? geo.country ?? "Unknown"}`
        : "Unknown",
      ip: context.ip ?? "Unknown",
      time: new Date(),
    });
  }

  await AuthTokenModel.create({
    userId: user._id,
    deviceId: existingDevice?._id ?? newDevice?._id,
    email: user.email,
    tokenHash: refreshTokenHash,
    type: AuthTokenType.REFRESH,
    expiresAt: new Date(
      Date.now() + AUTH_SECURITY.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
    ),
  });

  // 8️⃣ Audit success
  await AuditLogModel.create({
    userId: user._id,
    action: AuditAction.LOGIN_SUCCESS,
    ipAddress: context.ip,
    userAgent: context.userAgent,
  });

  // ✅ Persist LAST LOGIN SNAPSHOT (independent of device sessions)
  user.lastLoginDevice = {
    deviceType: "web",
    userAgent: context.userAgent ?? "Unknown",
    ipAddress: context.ip ?? "Unknown",
    location: geo
      ? `${geo.city ?? geo.region ?? geo.country ?? "Unknown"}`
      : "Unknown",
    loggedInAt: new Date(),
  };

  // 4️⃣ Reset login attempts on success
  user.loginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const safeUser = {
    id: user._id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatar: user.avatar ?? null,
    emailVerified: user.emailVerified,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
    lastLoginDevice: {
      deviceType: user.lastLoginDevice.deviceType,
      userAgent: user.lastLoginDevice.userAgent,
      ipAddress: user.lastLoginDevice.ipAddress,
      location: user.lastLoginDevice.location,
      loggedInAt: user.lastLoginDevice.loggedInAt,
    },
    createdAt: user.createdAt,
  };

  return {
    user: safeUser,
    refreshToken: rawRefreshToken,
  };
}

// Refresh Token
export async function refreshSession(
  rawRefreshToken: string,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const tokenHash = createHash("sha256").update(rawRefreshToken).digest("hex");

  // SINGLE-USE: Find and delete in one atomic step
  const tokenDoc = await AuthTokenModel.findOneAndDelete({
    tokenHash,
    type: AuthTokenType.REFRESH,
  });

  if (!tokenDoc) {
    // Possible reuse or theft attempt
    await AuditLogModel.create({
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      ipAddress: context.ip,
      userAgent: context.userAgent,
      metadata: {
        reason: "refresh_token_reuse_or_invalid",
      },
    });

    throw new Error("Invalid refresh token.");
  }

  if (tokenDoc.expiresAt < new Date()) {
    throw new Error("Refresh token expired.");
  }

  const user = await UserModel.findById(tokenDoc.userId);

  if (!user) {
    throw new Error("User not found.");
  }

  // Issue new refresh token (rotation)
  const newRawRefreshToken = randomBytes(32).toString("hex");
  const newTokenHash = createHash("sha256")
    .update(newRawRefreshToken)
    .digest("hex");

  await AuthTokenModel.create({
    userId: user._id,
    email: user.email,
    tokenHash: newTokenHash,
    type: AuthTokenType.REFRESH,
    expiresAt: new Date(
      Date.now() + AUTH_SECURITY.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
    ),
  });

  //   const accessToken = user.$locals?.jwtSign
  //     ? user.$locals.jwtSign()
  //     : null;

  // If you prefer fastify jwt directly:
  // accessToken will be signed in controller using reply.server.jwt

  await AuditLogModel.create({
    userId: user._id,
    action: AuditAction.LOGIN_SUCCESS,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: {
      via: "refresh_token",
    },
  });

  return {
    accessToken: null, // will be signed in controller
    newRefreshToken: newRawRefreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
  };
}

// Logout
export async function logoutUser(
  rawRefreshToken: string,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const tokenHash = createHash("sha256").update(rawRefreshToken).digest("hex");

  const tokenDoc = await AuthTokenModel.findOneAndDelete({
    tokenHash,
    type: AuthTokenType.REFRESH,
  });

  // Token might already be deleted or expired → still OK
  if (tokenDoc?.userId) {
    await AuditLogModel.create({
      userId: tokenDoc.userId,
      action: AuditAction.LOGOUT,
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });
  }
}
