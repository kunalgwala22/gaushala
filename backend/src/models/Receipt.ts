import { Schema, model, Document } from 'mongoose';

export interface IReceipt extends Document {
  receiptNumber: string;
  donationId: Schema.Types.ObjectId;
  pdfUrl: string;
  generatedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    receiptNumber: { type: String, required: true, unique: true },
    donationId: { type: Schema.Types.ObjectId, ref: 'Donation', required: true },
    pdfUrl: { type: String, required: true },
    generatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

ReceiptSchema.index({ receiptNumber: 1 });
ReceiptSchema.index({ donationId: 1 });

export const Receipt = model<IReceipt>('Receipt', ReceiptSchema);
