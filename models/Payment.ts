import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  type: 'entry' | 'monthly' | 'extra';
  amount: number;
  date: Date;
  receiptNo: string;
  monthCovered?: string; // e.g. "2026-08" or "August 2026"
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    type: {
      type: String,
      enum: ['entry', 'monthly', 'extra'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    receiptNo: { type: String, required: true, unique: true, index: true },
    monthCovered: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema, 'payments');
