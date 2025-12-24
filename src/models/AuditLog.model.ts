import { Schema, model, Document, Types } from "mongoose";
import { AuditAction } from "../types/enum";

export interface AuditLogDocument extends Document {
  userId?: Types.ObjectId;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: string;
  path?: string;
  method?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },

    ipAddress: String,
    userAgent: String,
    geoLocation: String,

    path: String,
    method: String,

    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLogModel = model<AuditLogDocument>(
  "AuditLog",
  AuditLogSchema
);
