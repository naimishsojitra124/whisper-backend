import { FastifyInstance } from "fastify";
import {
  createChangePasswordController,
  createConfirmTwoFactorController,
  createInitiateTwoFactorController,
  createRequestEmailChangeController,
  getCurrentUserController,
  listUserDevicesController,
  logoutAllOtherDevicesController,
  revokeDeviceController,
  updateUserProfileController,
  verifyEmailChangeController,
} from "../controllers/user.controller";

export async function userRoutes(app: FastifyInstance) {
  // Get Current User
  app.get("/me", { preHandler: app.authenticate }, getCurrentUserController);

  // Update User Profile (firstName, lastName, username, avatar)
  app.put("/me", { preHandler: app.authenticate }, updateUserProfileController);

  // Change Password
  app.post(
    "/change-password",
    { preHandler: app.authenticate },
    createChangePasswordController(app)
  );

  // Change Email
  app.post(
    "/change-email",
    { preHandler: app.authenticate },
    createRequestEmailChangeController(app)
  );

  // Verify Email Change
  app.get("/verify-email-change", verifyEmailChangeController);

  // Initiate 2FA Setup
  app.post(
    "/2fa/setup",
    { preHandler: app.authenticate },
    createInitiateTwoFactorController(app)
  );

  // Confirm & enable 2FA
  app.post(
    "/2fa/confirm",
    { preHandler: app.authenticate },
    createConfirmTwoFactorController(app)
  );

  // List User Devices
  app.get(
    "/devices",
    { preHandler: app.authenticate },
    listUserDevicesController
  );

  // Revoke Device Session
  app.delete(
    "/devices/:deviceId",
    { preHandler: app.authenticate },
    revokeDeviceController
  );

  // Logout other Devices
  app.post(
    "/devices/logout-others",
    { preHandler: app.authenticate },
    logoutAllOtherDevicesController
  );
}
