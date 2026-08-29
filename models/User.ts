import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  memberId?: mongoose.Types.ObjectId | null;
  phone: string;
  passwordHash: string;
  role: 'admin' | 'member';
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', default: null },
    phone: { type: String, required: true, unique: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
