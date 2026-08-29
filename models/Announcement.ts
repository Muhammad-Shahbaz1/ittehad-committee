import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  title?: string;
  message: string;
  type: 'death' | 'reminder' | 'general';
  date: Date;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ['death', 'reminder', 'general'], default: 'general', index: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'Admin' },
  },
  { timestamps: true }
);

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema, 'announcements');
