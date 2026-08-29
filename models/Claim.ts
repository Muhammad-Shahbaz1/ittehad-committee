import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClaim extends Document {
  _id: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  dependentId?: mongoose.Types.ObjectId | null;
  deceasedName?: string; // Cache deceased person name for direct reporting
  dateOfDeath: Date;
  amountPaid: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    dependentId: { type: Schema.Types.ObjectId, ref: 'Dependent', default: null },
    deceasedName: { type: String, default: '' },
    dateOfDeath: { type: Date, required: true },
    amountPaid: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Claim: Model<IClaim> =
  mongoose.models.Claim || mongoose.model<IClaim>('Claim', ClaimSchema, 'claims');
