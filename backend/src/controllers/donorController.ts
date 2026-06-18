import { Response, NextFunction } from 'express';
import { Donor } from '../models/Donor';
import { AuthenticatedRequest } from '../middleware/auth';
import { donorSchema } from '../validators';
import { encrypt } from '../utils/encryption';

/**
 * Get paginated, searched and filtered donors list
 */
export const getDonors = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const city = (req.query.city as string) || '';
    const state = (req.query.state as string) || '';

    const query: any = {};

    // Search query by text (fullName, mobileNumber, email)
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobileNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (state) {
      query.state = { $regex: state, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const donors = await Donor.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donor.countDocuments(query);

    // Prepare response, omitting raw IV/Tag and decrypting Aadhaar for authorized staff/admins
    const formattedDonors = donors.map((donor) => {
      const donorObj = donor.toObject() as any;
      if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF')) {
        donorObj.aadhaarNumber = donor.getDecryptedAadhaar();
      }
      delete donorObj.aadhaarEncrypted;
      delete donorObj.aadhaarIv;
      delete donorObj.aadhaarTag;
      return donorObj;
    });

    res.json({
      donors: formattedDonors,
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
 * Get single donor by ID
 */
export const getDonorById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found.' });
    }

    const donorObj = donor.toObject() as any;
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF')) {
      donorObj.aadhaarNumber = donor.getDecryptedAadhaar();
    }
    delete donorObj.aadhaarEncrypted;
    delete donorObj.aadhaarIv;
    delete donorObj.aadhaarTag;

    res.json(donorObj);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new donor profile
 */
export const createDonor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = donorSchema.parse(req.body);

    // Encrypt Aadhaar if provided
    let aadhaarEncryptedData = {};
    if (validatedData.aadhaarNumber) {
      const { encryptedText, iv, tag } = encrypt(validatedData.aadhaarNumber);
      aadhaarEncryptedData = {
        aadhaarEncrypted: encryptedText,
        aadhaarIv: iv,
        aadhaarTag: tag,
      };
    }

    const newDonor = new Donor({
      fullName: validatedData.fullName,
      mobileNumber: validatedData.mobileNumber,
      email: validatedData.email || undefined,
      address: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      pincode: validatedData.pincode,
      panNumber: validatedData.panNumber || undefined,
      ...aadhaarEncryptedData,
      donationPreference: validatedData.donationPreference || undefined,
      notes: validatedData.notes || undefined,
      createdBy: req.user!.userId,
    });

    await newDonor.save();

    res.status(201).json({
      message: 'Donor record created successfully.',
      donor: newDonor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing donor profile
 */
export const updateDonor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = donorSchema.parse(req.body);
    const donor = await Donor.findById(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found.' });
    }

    // Update base fields
    donor.fullName = validatedData.fullName;
    donor.mobileNumber = validatedData.mobileNumber;
    donor.email = validatedData.email || undefined;
    donor.address = validatedData.address;
    donor.city = validatedData.city;
    donor.state = validatedData.state;
    donor.pincode = validatedData.pincode;
    donor.panNumber = validatedData.panNumber || undefined;
    donor.donationPreference = validatedData.donationPreference || undefined;
    donor.notes = validatedData.notes || undefined;

    // Encrypt Aadhaar if a new one is provided and differs, or if it was not set previously
    if (validatedData.aadhaarNumber) {
      const decryptedCurrent = donor.getDecryptedAadhaar();
      if (decryptedCurrent !== validatedData.aadhaarNumber) {
        const { encryptedText, iv, tag } = encrypt(validatedData.aadhaarNumber);
        donor.aadhaarEncrypted = encryptedText;
        donor.aadhaarIv = iv;
        donor.aadhaarTag = tag;
      }
    } else {
      // Clear Aadhaar if explicitly set to empty
      donor.aadhaarEncrypted = undefined;
      donor.aadhaarIv = undefined;
      donor.aadhaarTag = undefined;
    }

    await donor.save();

    res.json({
      message: 'Donor record updated successfully.',
      donor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a donor profile (ADMIN ONLY)
 */
export const deleteDonor = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found.' });
    }
    res.json({ message: 'Donor record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
