import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import {
  changeUserPassword,
  confirmAndEnableTwoFactor,
  getCurrentUser,
  initiateTwoFactorSetup,
  listUserDevices,
  logoutAllOtherDevices,
  requestEmailChange,
  revokeDeviceSession,
  updateUserProfile,
  verifyEmailChange,
} from "../services/user.service";
import {
  changeEmailSchema,
  changePasswordSchema,
  confirmTwoFactorSchema,
  updateProfileSchema,
} from "../schemas/user.schema";
import { sendPasswordChangedEmail } from "../lib/mail/mail";

// Get Current User
export async function getCurrentUserController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any)?.userId;

  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized." });
  }

  const result = await getCurrentUser(userId);

  const user = result?.user;

  if (!user) {
    return reply.status(404).send({ error: "User not found." });
  }

  return reply.status(200).send({ user });
}

// List User Devices
export async function listUserDevicesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any)?.userId;

  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized." });
  }

  const devices = await listUserDevices(userId);

  return reply.status(200).send({
    devices,
  });
}

// Revoke Device Session
export async function revokeDeviceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any)?.userId;
  const { deviceId } = request.params as { deviceId?: string };

  if (!userId || !deviceId) {
    return reply.status(400).send({ error: "Invalid request." });
  }

  await revokeDeviceSession(userId, deviceId, {
    ip: request.ip,
    userAgent: request.headers["user-agent"],
  });

  reply.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
  });

  return reply.status(200).send({
    success: "Device session revoked.",
  });
}

// Logout other Devices
export async function logoutAllOtherDevicesController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any)?.userId;
  const refreshToken = request.cookies?.refreshToken;

  if (!userId || !refreshToken) {
    return reply.status(401).send({ error: "Unauthorized." });
  }

  try {
    await logoutAllOtherDevices(userId, refreshToken, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    return reply.status(200).send({
      success: "Logged out from all other devices.",
    });
  } catch {
    return reply.status(401).send({
      error: "Session expired. Please log in again.",
    });
  }
}

// Update User Profile (firstName, lastName, username, avatar)
export async function updateUserProfileController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as any)?.userId;

  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized." });
  }

  const parsed = updateProfileSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({ error: "Invalid input." });
  }

  try {
    const user = await updateUserProfile(userId, parsed.data, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    return reply.status(200).send({
      success: "Profile updated successfully.",
      user,
    });
  } catch (err: any) {
    return reply.status(400).send({
      error: err.message || "Failed to update profile.",
    });
  }
}

// Change Password
export function createChangePasswordController(fastify: FastifyInstance) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;
    const refreshToken = request.cookies?.refreshToken;

    if (!userId) {
      return reply.status(401).send({ error: "Unauthorized." });
    }

    const parsed = changePasswordSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input." });
    }

    try {
      const result = await changeUserPassword(
        userId,
        parsed.data,
        refreshToken,
        {
          ip: request.ip,
          userAgent: request.headers["user-agent"],
        }
      );

      const timeIST = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "medium",
      });

      if (result.success) {
        await sendPasswordChangedEmail(fastify, {
          email: result.email,
          userName: result.userName,
          ip: result.ip,
          device: result.device,
          location: result.location,
          time: timeIST,
        });
      }

      return reply.status(200).send({
        success: "Password changed successfully.",
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message || "Failed to change password.",
      });
    }
  };
}

// Change Email
export function createRequestEmailChangeController(fastify: FastifyInstance) {
  return async function (request: any, reply: any) {
    const userId = request.user?.userId;
    const parsed = changeEmailSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid email." });
    }

    await requestEmailChange(fastify, userId, parsed.data.newEmail, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    return reply.send({
      success: "Verification link sent to new email address.",
    });
  };
}

// Verify Email Change
export async function verifyEmailChangeController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { token } = request.query as { token?: string };

  if (!token) {
    return reply.status(400).send({
      error: "Verification token is missing.",
    });
  }

  try {
    await verifyEmailChange(token, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    // Redirect is optional; API response is safer for now
    return reply.status(200).send({
      success: "Email address successfully updated.",
    });
  } catch (err: any) {
    return reply.status(400).send({
      error: err.message || "Invalid or expired verification link.",
    });
  }
}

// Initiate 2FA Setup
export function createInitiateTwoFactorController(fastify: FastifyInstance) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;

    if (!userId) {
      return reply.status(401).send({ error: "Unauthorized." });
    }

    try {
      const data = await initiateTwoFactorSetup(fastify, userId, {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      });

      return reply.send({
        ...data,
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message,
      });
    }
  };
}

// Confirm 2FA
export function createConfirmTwoFactorController(fastify: FastifyInstance) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any)?.userId;

    if (!userId) {
      return reply.status(401).send({ error: "Unauthorized." });
    }

    const parsed = confirmTwoFactorSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: "Invalid input." });
  }

    try {
      await confirmAndEnableTwoFactor(fastify, userId,
      parsed.data,
      {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      });

      return reply.send({
        success: "Two-factor authentication enabled successfully.",
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message,
      });
    }
  };
}
