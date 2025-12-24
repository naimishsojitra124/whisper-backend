import { Schema, model, Document, Types } from 'mongoose';
import { AuthTokenType } from '../types/enum';

export interface AuthTokenDocument extends Document {
  userId: Types.ObjectId;
  deviceId?: Types.ObjectId;
  email: string;
  tokenHash: string;
  type: AuthTokenType;
  expiresAt: Date;
  createdAt: Date;
}

const AuthTokenSchema = new Schema<AuthTokenDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },

    email: { type: String, required: true },
    tokenHash: { type: String, required: true, index: true },

    type: {
      type: String,
      enum: Object.values(AuthTokenType),
      required: true
    },

    expiresAt: { 
      type: Date, 
      required: true,
      index: { expires: 0 } // ⬅ TTL INDEX
     }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuthTokenModel = model<AuthTokenDocument>(
  'AuthToken',
  AuthTokenSchema
);
