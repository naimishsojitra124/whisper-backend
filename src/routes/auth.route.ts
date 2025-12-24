import { FastifyInstance } from "fastify";
import {
  createLoginController,
  createRegisterController,
  logoutController,
  refreshTokenController,
  verifyEmailController,
} from "../controllers/auth.controller";

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post("/register", createRegisterController(app));

  // Email verification
  app.get("/verify-email", verifyEmailController);

  // Login
  app.post("/login", createLoginController(app));

  // Logout
  app.post("/logout", logoutController);

  // Refresh Token
  app.post("/refresh", refreshTokenController);
}
