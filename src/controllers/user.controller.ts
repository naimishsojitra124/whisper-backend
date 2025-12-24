import { FastifyRequest, FastifyReply } from "fastify";
import {
  getCurrentUser,
  listUserDevices,
  logoutAllOtherDevices,
  revokeDeviceSession,
  updateUserProfile,
} from "../services/user.service";
import { updateProfileSchema } from "../schemas/user.schema";

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
    return reply.status(401).send({ error: 'Unauthorized.' });
  }

  try {
    await logoutAllOtherDevices(userId, refreshToken, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(200).send({
      success: 'Logged out from all other devices.',
    });
  } catch {
    return reply.status(401).send({
      error: 'Session expired. Please log in again.',
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
    return reply.status(401).send({ error: 'Unauthorized.' });
  }

  const parsed = updateProfileSchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.status(400).send({ error: 'Invalid input.' });
  }

  try {
    const user = await updateUserProfile(
      userId,
      parsed.data,
      {
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      }
    );

    return reply.status(200).send({
      success: 'Profile updated successfully.',
      user,
    });
  } catch (err: any) {
    return reply.status(400).send({
      error: err.message || 'Failed to update profile.',
    });
  }
}
