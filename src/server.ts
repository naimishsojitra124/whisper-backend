import { buildApp } from './app';

async function startServer() {
  const app = await buildApp();

  try {
    await app.listen({
      port: app.config.PORT,
      host: '0.0.0.0'
    });

    app.log.info(
      `🚀 Server running on port ${app.config.PORT} (${app.config.NODE_ENV})`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

startServer();
