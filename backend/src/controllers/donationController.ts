import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { Donation } from '../models/Donation';
import { Donor } from '../models/Donor';
import { Receipt } from '../models/Receipt';
import { RecurringDonation } from '../models/RecurringDonation';
import { AuthenticatedRequest } from '../middleware/auth';
import { donationSchema } from '../validators';
import { generateReceiptPDF } from '../services/pdfService';
import { AppError } from '../middleware/error';

/**
 * Helper to calculate next due date based on frequency
 */
const calculateNextDueDate = (startDate: Date, frequency: 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY'): Date => {
  const nextDate = new Date(startDate);
  if (frequency === 'MONTHLY') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (frequency === 'HALF_YEARLY') {
    nextDate.setMonth(nextDate.getMonth() + 6);
  } else if (frequency === 'YEARLY') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  return nextDate;
};

/**
 * Get paginated, searched and filtered donations list
 */
export const getDonations = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = (req.query.category as string) || '';
    const type = (req.query.type as string) || '';
    const search = (req.query.search as string) || ''; // searches donor name
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (type) {
      query.type = type;
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Donor restriction (Donors can only view their own donations)
    if (req.user && req.user.role === 'DONOR') {
      if (!req.user.donorId) {
        return res.json({ donations: [], page, limit, total: 0, pages: 0 });
      }
      query.donorId = req.user.donorId;
    } else if (search) {
      // Find matching donor IDs by searching their name
      const matchingDonors = await Donor.find({
        fullName: { $regex: search, $options: 'i' },
      }).select('_id');
      const donorIds = matchingDonors.map((d) => d._id);
      query.donorId = { $in: donorIds };
    }

    const skip = (page - 1) * limit;

    const donations = await Donation.find(query)
      .populate('donorId', 'fullName mobileNumber email panNumber address city state pincode')
      .populate('receiptId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single donation by ID
 */
export const getDonationById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'fullName mobileNumber email panNumber address city state pincode')
      .populate('receiptId');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    // Restrict donors to their own records
    if (req.user && req.user.role === 'DONOR' && donation.donorId.toString() !== req.user.donorId) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    res.json(donation);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new donation and auto-generate receipt PDF
 */
export const createDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = donationSchema.parse(req.body);

    const donor = await Donor.findById(validatedData.donorId);
    if (!donor) {
      throw new AppError('Donor profile not found.', 404);
    }

    // 1. Calculate Receipt Number based on Financial Year (April - March)
    const donationDate = validatedData.date || new Date();
    const currentYear = donationDate.getFullYear();
    const currentMonth = donationDate.getMonth(); // 0 = Jan, 3 = Apr
    
    let startYear = currentYear;
    if (currentMonth < 3) { // Jan, Feb, Mar belong to previous financial year
      startYear = currentYear - 1;
    }
    const endYear = (startYear + 1) % 100;
    const finYearStr = `${startYear}-${endYear.toString().padStart(2, '0')}`;

    // Find the sequence for the current financial year
    const lastReceipt = await Receipt.findOne({
      receiptNumber: new RegExp(`SSSG/${finYearStr}/`),
    }).sort({ createdAt: -1 });

    let seq = 1;
    if (lastReceipt) {
      const parts = lastReceipt.receiptNumber.split('/');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }
    const receiptNumber = `SSSG/${finYearStr}/${seq.toString().padStart(4, '0')}`;

    // 2. Create the Donation first (without receiptId temporarily)
    const newDonation = new Donation({
      donorId: validatedData.donorId,
      amount: validatedData.amount,
      type: validatedData.type,
      category: validatedData.category,
      paymentMethod: validatedData.paymentMethod,
      transactionId: validatedData.transactionId || undefined,
      notes: validatedData.notes || undefined,
      date: donationDate,
      status: validatedData.status,
    });

    await newDonation.save();

    // 3. Generate receipt PDF
    const pdfRelativePath = await generateReceiptPDF({
      receiptNumber,
      donorName: donor.fullName,
      mobileNumber: donor.mobileNumber,
      panNumber: donor.panNumber,
      address: `${donor.address}, ${donor.city}, ${donor.state} - ${donor.pincode}`,
      amount: validatedData.amount,
      category: validatedData.category,
      paymentMethod: validatedData.paymentMethod,
      transactionId: validatedData.transactionId,
      date: donationDate,
    });

    // 4. Save the Receipt record
    const newReceipt = new Receipt({
      receiptNumber,
      donationId: newDonation._id,
      pdfUrl: pdfRelativePath,
      generatedAt: new Date(),
    });

    await newReceipt.save();

    // 5. Update Donation with the receipt reference
    newDonation.receiptId = newReceipt._id as any;
    await newDonation.save();

    // 6. Handle Recurring Donation Schedule if applicable
    if (validatedData.type !== 'ONE_TIME' && validatedData.type !== 'CUSTOM') {
      const freq = validatedData.type as 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY';
      
      // Look for an existing active recurring schedule for this donor + category
      let recurring = await RecurringDonation.findOne({
        donorId: donor._id,
        category: validatedData.category,
        status: 'ACTIVE',
      });

      if (recurring) {
        recurring.amount = validatedData.amount;
        recurring.nextDueDate = calculateNextDueDate(donationDate, freq);
        await recurring.save();
      } else {
        recurring = new RecurringDonation({
          donorId: donor._id,
          amount: validatedData.amount,
          category: validatedData.category,
          frequency: freq,
          startDate: donationDate,
          nextDueDate: calculateNextDueDate(donationDate, freq),
          status: 'ACTIVE',
        });
        await recurring.save();
      }

      // Link donation to recurring schedule
      newDonation.recurringId = recurring._id as any;
      await newDonation.save();
    }

    // Re-populate and return
    const populatedDonation = await Donation.findById(newDonation._id)
      .populate('donorId', 'fullName mobileNumber email address city state pincode')
      .populate('receiptId');

    res.status(201).json({
      message: 'Donation recorded and receipt generated successfully.',
      donation: populatedDonation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing donation details
 */
export const updateDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = donationSchema.parse(req.body);
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    donation.amount = validatedData.amount;
    donation.type = validatedData.type;
    donation.category = validatedData.category;
    donation.paymentMethod = validatedData.paymentMethod;
    donation.transactionId = validatedData.transactionId || undefined;
    donation.notes = validatedData.notes || undefined;
    donation.date = validatedData.date || donation.date;
    donation.status = validatedData.status;

    await donation.save();

    res.json({
      message: 'Donation record updated successfully.',
      donation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a donation record (ADMIN ONLY)
 */
export const deleteDonation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found.' });
    }

    // Remove associated receipt PDF file if exists
    if (donation.receiptId) {
      const receipt = await Receipt.findById(donation.receiptId);
      if (receipt) {
        const filePath = path.join(__dirname, '../../', receipt.pdfUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await Receipt.findByIdAndDelete(donation.receiptId);
      }
    }

    await Donation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donation record and associated receipt deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
