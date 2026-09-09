import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  sender: 'user' | 'assistant';
  content: string;
  language: 'en' | 'hi';
  mode?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    mode: { type: String, default: 'default' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
