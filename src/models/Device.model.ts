import { Schema, model, Document, Types } from "mongoose";

export interface DeviceDocument extends Document {
  userId: Types.ObjectId;
  deviceType: string;
  userAgent?: string;
  ipAddress?: string;
  geoLocation: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<DeviceDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    deviceType: { type: String, required: true },
    userAgent: String,
    ipAddress: String,
    geoLocation: {
      country: { type: String, required: false },
      region: { type: String, required: false },
      city: { type: String, required: false },
      latitude: { type: Number, required: false },
      longitude: { type: Number, required: false },
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DeviceModel = model<DeviceDocument>("Device", DeviceSchema);
