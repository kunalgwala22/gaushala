import { Request, Response, NextFunction } from 'express';
import { Cow } from '../models/Cow';
import { cowSchema } from '../validators';
import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/error';

/**
 * Get paginated, searched and filtered cows list
 */
export const getCows = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = (req.query.search as string) || '';
    const healthStatus = (req.query.healthStatus as string) || '';
    const breed = (req.query.breed as string) || '';
    const gender = (req.query.gender as string) || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tagNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (healthStatus) {
      query.healthStatus = healthStatus;
    }

    if (breed) {
      query.breed = { $regex: breed, $options: 'i' };
    }

    if (gender) {
      query.gender = gender;
    }

    const skip = (page - 1) * limit;

    const cows = await Cow.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Cow.countDocuments(query);

    res.json({
      cows,
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
 * Get single cow details by ID
 */
export const getCowById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cow = await Cow.findById(req.params.id);
    if (!cow) {
      return res.status(404).json({ message: 'Cow not found.' });
    }
    res.json(cow);
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new cow (ADMIN ONLY)
 */
export const createCow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse the body. If values are strings from Form-data, handle parsing
    const body = { ...req.body };
    if (body.age) body.age = parseFloat(body.age);

    const validatedData = cowSchema.parse(body);

    // Check if tag number already exists
    const existingCow = await Cow.findOne({ tagNumber: validatedData.tagNumber.toUpperCase() });
    if (existingCow) {
      throw new AppError('A cow with this tag number already exists.', 400);
    }

    let photoUrl = validatedData.photoUrl;
    if (req.file) {
      photoUrl = `/uploads/cows/${req.file.filename}`;
    }

    const newCow = new Cow({
      name: validatedData.name,
      tagNumber: validatedData.tagNumber.toUpperCase(),
      breed: validatedData.breed,
      gender: validatedData.gender,
      age: validatedData.age,
      healthStatus: validatedData.healthStatus,
      photoUrl,
      shelterNumber: validatedData.shelterNumber,
    });

    await newCow.save();

    res.status(201).json({
      message: 'Cow record added successfully.',
      cow: newCow,
    });
  } catch (error) {
    // Clean up uploaded file if validation failed
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/cows', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

/**
 * Edit an existing cow details (ADMIN ONLY)
 */
export const updateCow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = { ...req.body };
    if (body.age) body.age = parseFloat(body.age);

    const validatedData = cowSchema.parse(body);
    const cow = await Cow.findById(req.params.id);
    if (!cow) {
      throw new AppError('Cow not found.', 404);
    }

    // Check tagNumber uniqueness if changing
    if (validatedData.tagNumber.toUpperCase() !== cow.tagNumber) {
      const existingTag = await Cow.findOne({ tagNumber: validatedData.tagNumber.toUpperCase() });
      if (existingTag) {
        throw new AppError('A cow with this tag number already exists.', 400);
      }
    }

    let photoUrl = cow.photoUrl;
    if (req.file) {
      // Delete old photo if it exists
      if (cow.photoUrl && cow.photoUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../', cow.photoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      photoUrl = `/uploads/cows/${req.file.filename}`;
    } else if (validatedData.photoUrl === '') {
      // If photo was cleared
      if (cow.photoUrl && cow.photoUrl.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '../../', cow.photoUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      photoUrl = undefined;
    }

    cow.name = validatedData.name;
    cow.tagNumber = validatedData.tagNumber.toUpperCase();
    cow.breed = validatedData.breed;
    cow.gender = validatedData.gender;
    cow.age = validatedData.age;
    cow.healthStatus = validatedData.healthStatus;
    cow.photoUrl = photoUrl;
    cow.shelterNumber = validatedData.shelterNumber;

    await cow.save();

    res.json({
      message: 'Cow record updated successfully.',
      cow,
    });
  } catch (error) {
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/cows', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    next(error);
  }
};

/**
 * Delete a cow record (ADMIN ONLY)
 */
export const deleteCow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cow = await Cow.findById(req.params.id);
    if (!cow) {
      return res.status(404).json({ message: 'Cow not found.' });
    }

    // Delete photo from filesystem
    if (cow.photoUrl && cow.photoUrl.startsWith('/uploads/')) {
      const photoPath = path.join(__dirname, '../../', cow.photoUrl);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await Cow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Cow record deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
