import { Schema, model, Document } from "mongoose";

export interface UserDocument extends Document {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  emailVerified?: Date;
  isTwoFactorEnabled: Date;
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

    isTwoFactorEnabled: Date,

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
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", UserSchema);
