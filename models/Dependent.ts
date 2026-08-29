import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDependent extends Document {
  _id: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  name: string;
  relation: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const DependentSchema = new Schema<IDependent>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true }, // e.g. Father, Mother, Spouse, Son, Daughter
  },
  { timestamps: true }
);

export const Dependent: Model<IDependent> =
  mongoose.models.Dependent || mongoose.model<IDependent>('Dependent', DependentSchema, 'dependents');
