import { Schema, model, Document, Types } from 'mongoose';

export interface ReadReceiptDocument extends Document {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReadReceiptSchema = new Schema<ReadReceiptDocument>(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

/**
 * Enforce ONE read receipt per user per message
 * This is CRITICAL — without this, duplicates WILL happen under load
 */
ReadReceiptSchema.index(
  { messageId: 1, userId: 1 },
  { unique: true }
);

export const ReadReceiptModel = model<ReadReceiptDocument>(
  'ReadReceipt',
  ReadReceiptSchema
);
