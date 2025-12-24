import Fastify, { FastifyInstance } from "fastify";

// plugins
import envPlugin from "./config/env";
import corsPlugin from "./plugins/cors.plugin";
import rateLimitPlugin from "./plugins/ratelimit.plugin";
import jwtPlugin from "./plugins/jwt.plugin";
import cookiePlugin from "./plugins/cookie.plugin";
// import websocketPlugin from './plugins/websocket.plugin';
import { authRoutes } from "./routes/auth.route";
import { userRoutes } from './routes/user.route';

// core
import { connectDB } from "./config/db";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    trustProxy: true,
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  // Register ENV FIRST, If this fails, app must not start
  await app.register(envPlugin);

  // Database
  await connectDB(app);

  // Core security plugins
    await app.register(corsPlugin);
    await app.register(rateLimitPlugin);
    await app.register(jwtPlugin);
    await app.register(cookiePlugin);
    // await app.register(websocketPlugin);

  // Health check (non-negotiable)
  app.get("/health", async () => {
    return {
      status: "ok",
      env: app.config.NODE_ENV,
    };
  });

  // Routes go here
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(userRoutes, { prefix: '/api/user' });

  return app;
}
