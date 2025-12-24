import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  app.register(jwt, {
    secret: app.config.JWT_ACCESS_SECRET,
    sign: {
      expiresIn: app.config.ACCESS_TOKEN_EXP
    }
  });

  app.decorate(
    'authenticate',
    async function (request: any, reply: any) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    }
  );
});
