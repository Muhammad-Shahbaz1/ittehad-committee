import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMember extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  cnic?: string;
  address?: string;
  joinDate: Date;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    cnic: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    joinDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

export const Member: Model<IMember> =
  mongoose.models.Member || mongoose.model<IMember>('Member', MemberSchema, 'members');
