import { Schema, model, Document, Types } from 'mongoose';
import { ConversationType } from '../types/enum';

export interface ConversationDocument extends Document {
  type: ConversationType;
  title?: string;
  groupAvatar?: string;
  inviteLink?: string;
  createdById: Types.ObjectId;
  lastUpdatedById?: Types.ObjectId;
  lastMessageId?: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<ConversationDocument>(
  {
    type: {
      type: String,
      enum: Object.values(ConversationType),
      required: true
    },
    title: String,
    groupAvatar: String,
    inviteLink: { type: String, unique: true, sparse: true },

    createdById: { type: Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedById: { type: Schema.Types.ObjectId, ref: 'User' },
    lastMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },

    deletedAt: Date
  },
  { timestamps: true }
);

export const ConversationModel = model<ConversationDocument>(
  'Conversation',
  ConversationSchema
);
