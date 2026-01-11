import { Schema, model, Document } from "mongoose";

export interface UserDocument extends Document {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  emailVerified?: Date;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorTempSecret?: string;
  twoFactorEnabledAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  avatar?: string;
  lastLoginDevice: {
    deviceType: string;
    userAgent: string;
    ipAddress: string;
    location: string;
    loggedInAt: Date;
  };
  pendingEmail?: string;
  pendingEmailRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    emailVerified: Date,

    isTwoFactorEnabled: {
      type: Boolean,
      default: false,
    },

    twoFactorSecret: {
      type: String,
    },

    twoFactorTempSecret: {
      type: String,
    },

    twoFactorEnabledAt: Date,

    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockedUntil: Date,
    lastLoginAt: Date,
    avatar: String,

    lastLoginDevice: {
      deviceType: String,
      userAgent: String,
      ipAddress: String,
      location: String,
      loggedInAt: Date,
    },

    pendingEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    pendingEmailRequestedAt: Date,
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", UserSchema);
