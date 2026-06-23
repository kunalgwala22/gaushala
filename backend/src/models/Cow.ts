import { Schema, model, Document } from 'mongoose';

export type HealthStatus = 'HEALTHY' | 'UNDER_TREATMENT' | 'CRITICAL' | 'RECOVERING';
export type CowGender = 'MALE' | 'FEMALE';

export interface ICow extends Document {
  name: string;
  tagNumber: string;
  breed: string;
  gender: CowGender;
  age: number; // in years
  healthStatus: HealthStatus;
  photoUrl?: string;
  shelterNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const CowSchema = new Schema<ICow>(
  {
    name: { type: String, required: true, trim: true },
    tagNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    breed: { type: String, required: true, trim: true },
    gender: { 
      type: String, 
      enum: ['MALE', 'FEMALE'], 
      required: true 
    },
    age: { type: Number, required: true, min: 0 },
    healthStatus: {
      type: String,
      enum: ['HEALTHY', 'UNDER_TREATMENT', 'CRITICAL', 'RECOVERING'],
      required: true,
      default: 'HEALTHY',
    },
    photoUrl: { type: String },
    shelterNumber: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

CowSchema.index({ healthStatus: 1 });

export const Cow = model<ICow>('Cow', CowSchema);
