import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import {
  loginUser,
  logoutUser,
  refreshSession,
  registerUser,
  verifyEmail,
} from "../services/auth.service";
import { sendVerificationEmail } from "../lib/mail/mail";

// Register
export function createRegisterController(fastify: FastifyInstance) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const parsed = registerSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input." });
    }

    try {
      const result = await registerUser(parsed.data, {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
        path: request.url,
        method: request.method,
      });

      // Email sending happens OUTSIDE core logic
      await sendVerificationEmail(fastify, {
        email: result.user.email,
        displayName: result.user.firstName || result.user.username || "User",
        token: result.verificationToken,
      });

      return reply.status(201).send({
        success:
          "Account created. Please check your email to verify your account.",
        user: result.user,
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: err.message || "Registration failed.",
      });
    }
  };
}

// Verify Email
export async function verifyEmailController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { token } = request.query as { token?: string };

  if (!token) {
    return reply.status(400).send({
      error: "Invalid or missing verification token.",
    });
  }

  try {
    await verifyEmail(token, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
      path: request.url,
      method: request.method,
    });

    return reply.status(200).send({
      success: "Email verified successfully. You can now log in.",
    });
  } catch (err: any) {
    return reply.status(400).send({
      error: err.message || "Invalid or expired verification link.",
    });
  }
}

// Login
export function createLoginController(fastify: FastifyInstance) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid input." });
    }

    try {
      const result = await loginUser(fastify, parsed.data, {
        ip: request.ip,
        userAgent: request.headers["user-agent"],
      });

      // Access token (short-lived)
      const accessToken = reply.server.jwt.sign({
        userId: result.user.id,
      });

      // Refresh token (HTTP-only cookie)
      reply.setCookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: reply.server.config.COOKIE_SECURE,
        sameSite: "strict",
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60,
      });

      return reply.status(200).send({
        success: "Login successful.",
        accessToken,
        user: result.user,
      });
    } catch (err: any) {
      return reply.status(401).send({
        error: err.message || "Login failed.",
      });
    }
  };
}
// Refresh Token
export async function refreshTokenController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const refreshToken = request.cookies?.refreshToken;

  if (!refreshToken) {
    return reply.status(401).send({ error: "Unauthorized." });
  }

  try {
    const { newRefreshToken, user } = await refreshSession(refreshToken, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });

    const accessToken = reply.server.jwt.sign({
      userId: user.id,
    });

    // rotate cookie
    reply.setCookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: reply.server.config.COOKIE_SECURE,
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.status(200).send({
      accessToken,
      user,
    });
  } catch (err: any) {
    // Kill cookie on any refresh failure
    reply.clearCookie("refreshToken", {
      path: "/api/auth/refresh",
    });

    return reply.status(401).send({
      error: "Session expired. Please log in again.",
    });
  }
}

// Logout
export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const refreshToken = request.cookies?.refreshToken;

  if (refreshToken) {
    await logoutUser(refreshToken, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
  }

  // Always clear cookie (even if token missing/invalid)
  reply.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
  });

  return reply.status(200).send({
    success: "Logged out successfully.",
  });
}
