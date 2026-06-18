import { Schema, model, Document } from 'mongoose';
import { DonationCategory } from './Donation';

export type RecurringFrequency = 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY';
export type RecurringStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export interface IRecurringDonation extends Document {
  donorId: Schema.Types.ObjectId;
  amount: number;
  category: DonationCategory;
  frequency: RecurringFrequency;
  startDate: Date;
  nextDueDate: Date;
  status: RecurringStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringDonationSchema = new Schema<IRecurringDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true },
    amount: { type: Number, required: true, min: 1 },
    category: {
      type: String,
      enum: [
        'GENERAL',
        'COW_FEEDING',
        'MEDICAL_SUPPORT',
        'COW_ADOPTION',
        'SHELTER_MAINTENANCE',
        'FESTIVAL',
        'GAU_SEVA',
      ],
      required: true,
    },
    frequency: {
      type: String,
      enum: ['MONTHLY', 'HALF_YEARLY', 'YEARLY'],
      required: true,
    },
    startDate: { type: Date, required: true, default: Date.now },
    nextDueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'CANCELLED'],
      required: true,
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

RecurringDonationSchema.index({ donorId: 1 });
RecurringDonationSchema.index({ status: 1 });
RecurringDonationSchema.index({ nextDueDate: 1 });

export const RecurringDonation = model<IRecurringDonation>(
  'RecurringDonation',
  RecurringDonationSchema
);
