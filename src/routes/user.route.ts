import { FastifyInstance } from "fastify";
import {
  getCurrentUserController,
  listUserDevicesController,
  logoutAllOtherDevicesController,
  revokeDeviceController,
  updateUserProfileController,
} from "../controllers/user.controller";

export async function userRoutes(app: FastifyInstance) {
  // Get Current User
  app.get("/me", { preHandler: app.authenticate }, getCurrentUserController);

  // Update User Profile (firstName, lastName, username, avatar)
  app.put("/me", { preHandler: app.authenticate }, updateUserProfileController);

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
