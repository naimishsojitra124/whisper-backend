import { Types } from "mongoose";
import { DeviceModel } from "../models/Device.model";
import { UserModel } from "../models/User.model";
import { AuthTokenModel } from "../models/AuthToken.model";
import { AuditAction, AuthTokenType } from "../types/enum";
import { AuditLogModel } from "../models/AuditLog.model";
import { createHash } from "crypto";
import { UpdateProfileInput } from "../schemas/user.schema";

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
