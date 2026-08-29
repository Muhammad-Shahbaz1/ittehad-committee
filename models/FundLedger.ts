import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFundLedger extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'credit' | 'debit';
  amount: number;
  date: Date;
  reference?: mongoose.Types.ObjectId | string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const FundLedgerSchema = new Schema<IFundLedger>(
  {
    type: { type: String, enum: ['credit', 'debit'], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    reference: { type: Schema.Types.Mixed, default: null }, // paymentId, claimId, or custom ref
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const FundLedger: Model<IFundLedger> =
  mongoose.models.FundLedger || mongoose.model<IFundLedger>('FundLedger', FundLedgerSchema, 'fundLedger');
