import { Schema, model, Document } from 'mongoose';

export type DonationType = 'ONE_TIME' | 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY' | 'CUSTOM';
export type DonationCategory = 
  | 'GENERAL' 
  | 'COW_FEEDING' 
  | 'MEDICAL_SUPPORT' 
  | 'COW_ADOPTION' 
  | 'SHELTER_MAINTENANCE' 
  | 'FESTIVAL' 
  | 'GAU_SEVA';
export type PaymentMethod = 'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export interface IDonation extends Document {
  donorId: Schema.Types.ObjectId;
  amount: number;
  type: DonationType;
  category: DonationCategory;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  date: Date;
  receiptId?: Schema.Types.ObjectId;
  recurringId?: Schema.Types.ObjectId;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true },
    amount: { type: Number, required: true, min: 1 },
    type: {
      type: String,
      enum: ['ONE_TIME', 'MONTHLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM'],
      required: true,
      default: 'ONE_TIME',
    },
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
      default: 'GENERAL',
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'OTHER'],
      required: true,
      default: 'CASH',
    },
    transactionId: { type: String, trim: true },
    notes: { type: String },
    date: { type: Date, required: true, default: Date.now },
    receiptId: { type: Schema.Types.ObjectId, ref: 'Receipt' },
    recurringId: { type: Schema.Types.ObjectId, ref: 'RecurringDonation' },
    status: {
      type: String,
      enum: ['COMPLETED', 'PENDING', 'FAILED'],
      required: true,
      default: 'COMPLETED',
    },
  },
  { timestamps: true }
);

// Indexes for query speed
DonationSchema.index({ donorId: 1 });
DonationSchema.index({ date: 1 });
DonationSchema.index({ category: 1 });
DonationSchema.index({ type: 1 });

export const Donation = model<IDonation>('Donation', DonationSchema);
