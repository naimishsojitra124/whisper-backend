import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    ban: 2, // temporary ban after limit exceeded twice
    errorResponseBuilder: () => ({
      error: 'Too many requests. Please slow down.'
    })
  });
});
