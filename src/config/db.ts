import mongoose from 'mongoose';
import { FastifyInstance } from 'fastify';

export async function connectDB(app: FastifyInstance) {
  try {
    await mongoose.connect(app.config.MONGO_URI);
    app.log.info('✅ MongoDB connected');
  } catch (err) {
    app.log.error(err, '❌ MongoDB connection failed');
    process.exit(1);
  }
}
