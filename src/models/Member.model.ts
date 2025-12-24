import { Schema, model, Document, Types } from 'mongoose';
import { MemberRole } from '../types/enum';

export interface MemberDocument extends Document {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
  isRemoved: boolean;
  removedAt?: Date;
  leftAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<MemberDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },

    role: {
      type: String,
      enum: Object.values(MemberRole),
      default: MemberRole.MEMBER
    },

    joinedAt: { type: Date, default: Date.now },
    isRemoved: { type: Boolean, default: false },
    removedAt: Date,
    leftAt: Date,
    deletedAt: Date
  },
  { timestamps: true }
);

MemberSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const MemberModel = model<MemberDocument>('Member', MemberSchema);
