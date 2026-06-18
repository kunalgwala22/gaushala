import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'STAFF' | 'DONOR';
  donorId?: Schema.Types.ObjectId;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['ADMIN', 'STAFF', 'DONOR'], 
      default: 'STAFF', 
      required: true 
    },
    donorId: { type: Schema.Types.ObjectId, ref: 'Donor' },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

// Indexes
UserSchema.index({ email: 1 });

export const User = model<IUser>('User', UserSchema);
