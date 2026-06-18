import { Schema, model, Document } from 'mongoose';
import { decrypt } from '../utils/encryption';

export interface IDonor extends Document {
  fullName: string;
  mobileNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  panNumber?: string;
  aadhaarEncrypted?: string;
  aadhaarIv?: string;
  aadhaarTag?: string;
  donationPreference?: string;
  notes?: string;
  createdBy: Schema.Types.ObjectId;
  getDecryptedAadhaar(): string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DonorSchema = new Schema<IDonor>(
  {
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, default: '9999999999', trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, default: 'Ganesh Road' },
    city: { type: String, default: 'Devali', trim: true },
    state: { type: String, default: 'Rajasthan', trim: true },
    pincode: { type: String, default: '304804', trim: true },
    panNumber: { type: String, uppercase: true, trim: true },
    aadhaarEncrypted: { type: String },
    aadhaarIv: { type: String },
    aadhaarTag: { type: String },
    donationPreference: { type: String, trim: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for searching
DonorSchema.index({ fullName: 'text', mobileNumber: 1, email: 1 });
DonorSchema.index({ mobileNumber: 1 });

DonorSchema.methods.getDecryptedAadhaar = function(this: IDonor): string | null {
  if (this.aadhaarEncrypted && this.aadhaarIv && this.aadhaarTag) {
    return decrypt(this.aadhaarEncrypted, this.aadhaarIv, this.aadhaarTag);
  }
  return null;
};

export const Donor = model<IDonor>('Donor', DonorSchema);
