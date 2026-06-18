import { Schema, model, Document } from 'mongoose';

export interface ISponsorship extends Document {
  donorId: Schema.Types.ObjectId;
  cowId: Schema.Types.ObjectId;
  amount: number;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

const SponsorshipSchema = new Schema<ISponsorship>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor', required: true },
    cowId: { type: Schema.Types.ObjectId, ref: 'Cow', required: true },
    amount: { type: Number, required: true, min: 1 },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED'],
      required: true,
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

SponsorshipSchema.index({ donorId: 1 });
SponsorshipSchema.index({ cowId: 1 });
SponsorshipSchema.index({ status: 1 });

export const Sponsorship = model<ISponsorship>('Sponsorship', SponsorshipSchema);
