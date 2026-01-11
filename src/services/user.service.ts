import { Types } from "mongoose";
import { DeviceModel } from "../models/Device.model";
import { UserModel } from "../models/User.model";
import { AuthTokenModel } from "../models/AuthToken.model";
import { AuditAction, AuthTokenType } from "../types/enum";
import { AuditLogModel } from "../models/AuditLog.model";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  ChangePasswordInput,
  UpdateProfileInput,
} from "../schemas/user.schema";
import {
  sendEmailChangeNotification,
  sendTwoFactorEnabledEmail,
  sendTwoFactorOtpEmail,
  sendVerificationEmail,
} from "../lib/mail/mail";
import { FastifyInstance } from "fastify";
import { lookupGeoIp } from "../lib/geoip/geoip";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { decrypt, encrypt } from "../utils/crypto";

// Get Current User
export async function getCurrentUser(userId: string) {
  const user = await UserModel.findById(userId).select("-password").lean();

  if (!user) return null;

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
  };
}

// List User Devices
export async function listUserDevices(userId: string) {
  const devices = await DeviceModel.find({ userId })
    .sort({ lastActiveAt: -1 })
    .select(
      "_id deviceType userAgent ipAddress geoLocation lastActiveAt createdAt"
    )
    .lean();

  return devices.map((device) => ({
    id: device._id,
    deviceType: device.deviceType,
    userAgent: device.userAgent ?? null,
    ipAddress: device.ipAddress ?? null,
    geoLocation: device.geoLocation ?? null,
    lastActiveAt: device.lastActiveAt,
    createdAt: device.createdAt,
  }));
}

// Revoke Device Session
export async function revokeDeviceSession(
  userId: string,
  deviceId: string,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  if (!Types.ObjectId.isValid(deviceId)) {
    throw new Error("Invalid device.");
  }

  const device = await DeviceModel.findOne({
    _id: deviceId,
    userId,
  });

  if (!device) {
    // Idempotent: don’t reveal if device exists
    return;
  }

  // 1️⃣ Delete all refresh tokens for this device
  await AuthTokenModel.deleteMany({
    userId,
    deviceId: device._id,
    type: AuthTokenType.REFRESH,
  });

  // 2️⃣ Remove device record
  await DeviceModel.deleteOne({ _id: device._id });

  // 3️⃣ Audit log
  await AuditLogModel.create({
    userId,
    action: AuditAction.LOGOUT,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: {
      revokedDeviceId: deviceId,
    },
  });
}

// Logout other Devices
export async function logoutAllOtherDevices(
  userId: string,
  rawRefreshToken: string,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const tokenHash = createHash("sha256").update(rawRefreshToken).digest("hex");

  // 1️⃣ Identify current session
  const currentToken = await AuthTokenModel.findOne({
    userId,
    tokenHash,
    type: AuthTokenType.REFRESH,
  });

  if (!currentToken || !currentToken.deviceId) {
    throw new Error("Invalid session.");
  }

  const currentDeviceId = currentToken.deviceId;

  // 2️⃣ Delete all OTHER refresh tokens
  await AuthTokenModel.deleteMany({
    userId,
    type: AuthTokenType.REFRESH,
    deviceId: { $ne: currentDeviceId },
  });

  // 3️⃣ Delete all OTHER devices
  await DeviceModel.deleteMany({
    userId,
    _id: { $ne: currentDeviceId },
  });

  // 4️⃣ Audit log
  await AuditLogModel.create({
    userId,
    action: AuditAction.LOGOUT,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: {
      scope: "logout_all_except_current",
      keptDeviceId: currentDeviceId.toString(),
    },
  });
}

// Update User Profile (firstName, lastName, username, avatar)
export async function updateUserProfile(
  userId: string,
  updates: UpdateProfileInput,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  // Username uniqueness check (only if updating)
  if (updates.username) {
    const existing = await UserModel.findOne({
      username: updates.username,
      _id: { $ne: userId },
    });

    if (existing) {
      throw new Error("Username already taken.");
    }
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      $set: updates,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .select("-password")
    .lean();

  if (!user) {
    throw new Error("User not found.");
  }

  await AuditLogModel.create({
    userId,
    action: AuditAction.PROFILE_UPDATED ?? AuditAction.SUSPICIOUS_ACTIVITY,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: {
      fieldsUpdated: Object.keys(updates),
    },
  });

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
  };
}

// Change Password
export async function changeUserPassword(
  userId: string,
  input: ChangePasswordInput,
  rawRefreshToken: string | undefined,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  // 1️⃣ Re-authenticate
  const isValid = await bcrypt.compare(input.currentPassword, user.password);

  if (!isValid) {
    await AuditLogModel.create({
      userId,
      action: AuditAction.PASSWORD_CHANGE_FAILED,
      ipAddress: context.ip,
      userAgent: context.userAgent,
    });

    throw new Error("Current password is incorrect.");
  }

  // 2️⃣ Prevent password reuse
  const isSamePassword = await bcrypt.compare(input.newPassword, user.password);

  if (isSamePassword) {
    throw new Error("New password must be different.");
  }

  // 3️⃣ Hash & update password
  const hashed = await bcrypt.hash(input.newPassword, 12);
  user.password = hashed;
  user.loginAttempts = 0;
  user.lockedUntil = undefined;
  await user.save();

  // 4️⃣ Identify current device (if exists)
  let currentDeviceId: string | undefined;

  if (rawRefreshToken) {
    const tokenHash = createHash("sha256")
      .update(rawRefreshToken)
      .digest("hex");

    const tokenDoc = await AuthTokenModel.findOne({
      userId,
      tokenHash,
      type: AuthTokenType.REFRESH,
    });

    if (tokenDoc?.deviceId) {
      currentDeviceId = tokenDoc.deviceId.toString();
    }
  }

  // 5️⃣ Revoke ALL refresh tokens except current device
  await AuthTokenModel.deleteMany({
    userId,
    type: AuthTokenType.REFRESH,
    ...(currentDeviceId ? { deviceId: { $ne: currentDeviceId } } : {}),
  });

  // 6️⃣ Audit success
  await AuditLogModel.create({
    userId,
    action: AuditAction.PASSWORD_CHANGED,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: {
      revokedAllOtherDevices: true,
    },
  });

  return {
    success: "Password changed successfully.",
    email: user.email,
    userName: user.firstName,
    ip: context.ip ?? "Unknown",
    device: context.userAgent ?? "Unknown device",
    location: user.lastLoginDevice?.location ?? "Unknown",
  };
}

// Change Email
export async function requestEmailChange(
  fastify: FastifyInstance,
  userId: string,
  newEmail: string,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const user = await UserModel.findById(userId);

  if (!user) throw new Error("User not found.");

  if (user.email === newEmail) {
    throw new Error("New email must be different.");
  }

  // Ensure new email not already used
  const existing = await UserModel.findOne({ email: newEmail });
  if (existing) {
    throw new Error("Email already in use.");
  }

  // Store pending email
  user.pendingEmail = newEmail;
  user.pendingEmailRequestedAt = new Date();
  await user.save();

  // Invalidate previous email-change tokens
  await AuthTokenModel.deleteMany({
    userId,
    type: AuthTokenType.EMAIL_CHANGE,
  });

  // Generate single-use token
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await AuthTokenModel.create({
    userId,
    email: newEmail,
    tokenHash,
    type: AuthTokenType.EMAIL_CHANGE,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });

  // Send verification to NEW email
  await sendVerificationEmail(fastify, {
    email: newEmail,
    token: rawToken,
    displayName: user.firstName || user.username || "User",
    purpose: "change-email",
  });

  const timeIST = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  const geo = await lookupGeoIp(context.ip);

  // Notify OLD email
  await sendEmailChangeNotification(fastify, {
    displayName: user.firstName || user.username || "User",
    oldEmail: user.email,
    newEmail,
    time: timeIST,
    ip: context.ip ?? "Unknown",
    device: context.userAgent ?? "Unknown device",
    location: geo
      ? `${geo.city ?? "Unknown"}, ${geo.country ?? "Unknown"}`
      : "Unknown",
  });
  // Audit
  await AuditLogModel.create({
    userId,
    action: AuditAction.EMAIL_CHANGE_REQUESTED,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: { newEmail },
  });
}

// Verify Email Change
export async function verifyEmailChange(
  rawToken: string,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  // 1️⃣ Fetch & delete token atomically (single-use)
  const tokenDoc = await AuthTokenModel.findOneAndDelete({
    tokenHash,
    type: AuthTokenType.EMAIL_CHANGE,
  });

  if (!tokenDoc) {
    throw new Error("Invalid or expired verification link.");
  }

  if (tokenDoc.expiresAt < new Date()) {
    throw new Error("Verification link has expired.");
  }

  // 2️⃣ Fetch user
  const user = await UserModel.findById(tokenDoc.userId);

  if (!user || !user.pendingEmail) {
    throw new Error("Invalid email change request.");
  }

  const oldEmail = user.email;
  const newEmail = user.pendingEmail;

  // 3️⃣ Apply email change
  user.email = newEmail;
  user.pendingEmail = undefined;
  user.pendingEmailRequestedAt = undefined;
  user.emailVerified = new Date(); // critical
  await user.save();

  // 4️⃣ Cleanup any remaining email-change tokens
  await AuthTokenModel.deleteMany({
    userId: user._id,
    type: AuthTokenType.EMAIL_CHANGE,
  });

  // 5️⃣ Audit
  await AuditLogModel.create({
    userId: user._id,
    action: AuditAction.EMAIL_CHANGED,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    metadata: {
      oldEmail,
      newEmail,
    },
  });
}

// Initiate 2FA Setup
export async function initiateTwoFactorSetup(
  fastify: FastifyInstance,
  userId: string,
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const user = await UserModel.findById(userId);

  if (!user) throw new Error("User not found.");

  if (user.isTwoFactorEnabled) {
    throw new Error("Two-factor authentication already enabled.");
  }

  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `Whisper (${user.email})`,
  });

  // Encrypt before storing
  user.twoFactorTempSecret = encrypt(fastify, secret.base32);
  await user.save();

  // 2️⃣ Generate EMAIL OTP (NOT TOTP)
  const emailOtp = generateEmailOtp();
  const emailOtpHash = createHash("sha256").update(emailOtp).digest("hex");

  await AuthTokenModel.deleteMany({
    userId,
    type: AuthTokenType.TWO_FACTOR_EMAIL_OTP,
  });

  await AuthTokenModel.create({
    userId,
    email: user.email,
    tokenHash: emailOtpHash,
    type: AuthTokenType.TWO_FACTOR_EMAIL_OTP,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  // 3️⃣ Send OTP email
  await sendTwoFactorOtpEmail(fastify, {
    email: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    otp: emailOtp,
  });

  // 4️⃣ QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // 5️⃣ Audit
  await AuditLogModel.create({
    userId,
    action: AuditAction.TWO_FACTOR_SETUP_STARTED,
    ipAddress: context.ip,
    userAgent: context.userAgent,
  });

  return {
    qrCode,
    manualKey: secret.base32,
    message: "Verification code sent to your email.",
  };
}

// Confirm 2FA
export async function confirmAndEnableTwoFactor(
  fastify: FastifyInstance,
  userId: string,
  data: {
    totp?: string;
    emailOtp?: string;
  },
  context: {
    ip?: string;
    userAgent?: string;
  }
) {
  const user = await UserModel.findById(userId);

  if (!user) throw new Error("User not found.");

  if (user.isTwoFactorEnabled) {
    throw new Error("Two-factor authentication already enabled.");
  }

  if (!user.twoFactorTempSecret) {
    throw new Error("Two-factor setup not initiated.");
  }

  /* --------------------------------------------------
     1️⃣ Verify EMAIL OTP (single-use, hashed)
  -------------------------------------------------- */

  if (data.emailOtp) {
    const emailOtpHash = createHash("sha256")
      .update(data.emailOtp)
      .digest("hex");

    const emailOtpToken = await AuthTokenModel.findOneAndDelete({
      userId,
      type: AuthTokenType.TWO_FACTOR_EMAIL_OTP,
      tokenHash: emailOtpHash,
    });

    if (!emailOtpToken || emailOtpToken.expiresAt < new Date()) {
      await AuditLogModel.create({
        userId,
        action: AuditAction.TWO_FACTOR_ENABLE_FAILED,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        metadata: { reason: "invalid_email_otp" },
      });

      throw new Error("Invalid or expired email verification code.");
    }
  } else if (data.totp) {
    /* --------------------------------------------------
     2️⃣ Verify TOTP (Authenticator)
  -------------------------------------------------- */
    const secret = decrypt(fastify, user.twoFactorTempSecret);

    const totpValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token: data?.totp,
      window: 1, // allow slight clock drift
    });

    if (!totpValid) {
      await AuditLogModel.create({
        userId,
        action: AuditAction.TWO_FACTOR_ENABLE_FAILED,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        metadata: { reason: "invalid_totp" },
      });

      throw new Error("Invalid authentication code.");
    }
  }

  /* --------------------------------------------------
     3️⃣ Enable 2FA (atomic promotion)
  -------------------------------------------------- */

  // Promote temp secret → permanent
  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = undefined;
  user.isTwoFactorEnabled = true;
  user.twoFactorEnabledAt = new Date();
  await user.save();

  const timeIST = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });

  // Send enable notification email
  await sendTwoFactorEnabledEmail(fastify, {
    email: user.email,
    userName: `${user.firstName} ${user.lastName}`,
    time: timeIST,
    ip: context.ip ?? "Unknown",
    device: context.userAgent ?? "Unknown device",
  });

  // Audit success
  await AuditLogModel.create({
    userId,
    action: AuditAction.TWO_FACTOR_ENABLED,
    ipAddress: context.ip,
    userAgent: context.userAgent,
  });
}

export function generateEmailOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
}
