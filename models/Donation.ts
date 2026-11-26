import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDonation extends Document {
  type: 'inflow' | 'aid';
  personName: string;
  phone?: string;
  cnic?: string;
  category: string;
  amount: number;
  date: Date;
  notes?: string;
  receiptNo: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    type: {
      type: String,
      enum: ['inflow', 'aid'],
      required: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    cnic: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'General Donation',
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    receiptNo: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Donation: Model<IDonation> =
  mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema);
