import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow server-to-server / Postman / curl
      if (!origin) return cb(null, true);

      // TODO: replace with real frontend URLs
      const allowedOrigins = [
        'http://localhost:3000'
      ];

      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true
  });
});
