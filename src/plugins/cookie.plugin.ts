import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  app.register(cookie, {
    secret: app.config.JWT_REFRESH_SECRET,
  });
});
