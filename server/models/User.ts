import mongoose, { Schema } from 'mongoose';
import type { UserRecord } from '../types.ts';

const UserSchema = new Schema<UserRecord>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    createdAt: { type: String, required: true },
  },
  { versionKey: false },
);

export const UserModel =
  mongoose.models.User || mongoose.model<UserRecord>('User', UserSchema);
