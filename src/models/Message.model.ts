import { Schema, model, Document, Types } from "mongoose";
import { MessageType } from "../types/enum";

export interface MessageDocument extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: MessageType;
  isDeleted: boolean;
  isEdited: boolean;
  deletedAt?: Date;
  editedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<MessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },

    content: { type: String, required: true },

    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },

    isDeleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },

    deletedAt: Date,
    editedAt: Date,
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export const MessageModel = model<MessageDocument>("Message", MessageSchema);
