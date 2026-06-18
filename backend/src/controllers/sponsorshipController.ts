import { Request, Response, NextFunction } from 'express';
import { Sponsorship } from '../models/Sponsorship';
import { Donor } from '../models/Donor';
import { Cow } from '../models/Cow';
import { sponsorshipSchema } from '../validators';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';

/**
 * Get sponsorships with filters
 */
export const getSponsorships = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const status = (req.query.status as string) || '';
    const query: any = {};

    if (status) {
      query.status = status;
    }

    // Donors can only view their own sponsorships
    if (req.user && req.user.role === 'DONOR') {
      if (!req.user.donorId) {
        return res.json([]);
      }
      query.donorId = req.user.donorId;
    }

    // Automatically check and update expired sponsorships on fetch to ensure live status consistency
    const now = new Date();
    await Sponsorship.updateMany(
      { endDate: { $lt: now }, status: 'ACTIVE' },
      { status: 'EXPIRED' }
    );

    const sponsorships = await Sponsorship.find(query)
      .populate('donorId', 'fullName mobileNumber email')
      .populate('cowId', 'name tagNumber breed healthStatus photoUrl')
      .sort({ createdAt: -1 });

    res.json(sponsorships);
  } catch (error) {
    next(error);
  }
};

/**
 * Get sponsorship details by ID
 */
export const getSponsorshipById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const sponsorship = await Sponsorship.findById(req.params.id)
      .populate('donorId', 'fullName mobileNumber email')
      .populate('cowId', 'name tagNumber breed healthStatus photoUrl');

    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found.' });
    }

    if (req.user && req.user.role === 'DONOR' && sponsorship.donorId.toString() !== req.user.donorId) {
      return res.status(403).json({ message: 'Forbidden: Access denied.' });
    }

    res.json(sponsorship);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new sponsorship (ADMIN ONLY)
 */
export const createSponsorship = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = sponsorshipSchema.parse(req.body);

    const donor = await Donor.findById(validatedData.donorId);
    if (!donor) {
      throw new AppError('Donor profile not found.', 404);
    }

    const cow = await Cow.findById(validatedData.cowId);
    if (!cow) {
      throw new AppError('Cow not found.', 404);
    }

    // Determine status based on dates
    const now = new Date();
    const status = validatedData.endDate < now ? 'EXPIRED' : 'ACTIVE';

    const newSponsorship = new Sponsorship({
      donorId: validatedData.donorId,
      cowId: validatedData.cowId,
      amount: validatedData.amount,
      startDate: validatedData.startDate || new Date(),
      endDate: validatedData.endDate,
      status,
    });

    await newSponsorship.save();

    const populatedSponsorship = await Sponsorship.findById(newSponsorship._id)
      .populate('donorId', 'fullName mobileNumber email')
      .populate('cowId', 'name tagNumber breed healthStatus photoUrl');

    res.status(201).json({
      message: 'Cow sponsorship created successfully.',
      sponsorship: populatedSponsorship,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update sponsorship status (ADMIN ONLY)
 */
export const updateSponsorshipStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'EXPIRED'].includes(status)) {
      throw new AppError('Invalid status value. Must be ACTIVE or EXPIRED.', 400);
    }

    const sponsorship = await Sponsorship.findById(req.params.id);
    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found.' });
    }

    sponsorship.status = status;
    await sponsorship.save();

    res.json({
      message: 'Sponsorship status updated successfully.',
      sponsorship,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a sponsorship record (ADMIN ONLY)
 */
export const deleteSponsorship = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsorship = await Sponsorship.findByIdAndDelete(req.params.id);
    if (!sponsorship) {
      return res.status(404).json({ message: 'Sponsorship not found.' });
    }
    res.json({ message: 'Sponsorship record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
