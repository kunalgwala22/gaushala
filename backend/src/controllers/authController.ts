import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Donor } from '../models/Donor';
import { generateTokens, verifyRefreshToken, AuthenticatedRequest } from '../middleware/auth';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators';
import { sendResetPasswordEmail } from '../utils/mailer';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const totalUsers = await User.countDocuments();
    let assignedRole = validatedData.role;

    // First user is always ADMIN. Subsequent users can only be STAFF if created by an admin
    if (totalUsers === 0) {
      assignedRole = 'ADMIN';
    } else {
      const authReq = req as AuthenticatedRequest;
      // Only Admin can create other Admins or Staff
      if (assignedRole === 'ADMIN' || assignedRole === 'STAFF') {
        if (!authReq.user || authReq.user.role !== 'ADMIN') {
          return res.status(403).json({ message: 'Only administrators can create staff or admin accounts.' });
        }
      } else {
        assignedRole = 'DONOR';
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(validatedData.password, salt);

    const userId = new mongoose.Types.ObjectId();
    let donorId: mongoose.Types.ObjectId | undefined = validatedData.donorId 
      ? new mongoose.Types.ObjectId(validatedData.donorId) 
      : undefined;

    // Auto-create Donor profile for DONOR role registration
    if (assignedRole === 'DONOR' && !donorId) {
      const newDonor = new Donor({
        fullName: validatedData.name,
        mobileNumber: validatedData.mobileNumber || '0000000000',
        email: validatedData.email,
        address: validatedData.address || 'Not Provided',
        city: validatedData.city || 'Not Provided',
        state: validatedData.state || 'Not Provided',
        pincode: validatedData.pincode || '000000',
        createdBy: userId,
      });
      await newDonor.save();
      donorId = newDonor._id as mongoose.Types.ObjectId;
    }

    const newUser = new User({
      _id: userId,
      name: validatedData.name,
      email: validatedData.email,
      passwordHash,
      role: assignedRole,
      donorId: donorId || undefined,
    });

    await newUser.save();

    res.status(201).json({
      message: `User registered successfully as ${assignedRole}.`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    const user = await User.findOne({ email: validatedData.email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(validatedData.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      donorId: user.donorId ? user.donorId.toString() : undefined,
    };

    const { accessToken, refreshToken } = generateTokens(tokenPayload);

    // Save refresh token to user DB
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: 'Logged in successfully.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        donorId: user.donorId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
export const logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user.userId, { $unset: { refreshToken: 1 } });
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({ message: 'Invalid or expired refresh token.' });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        donorId: user.donorId ? user.donorId.toString() : undefined,
      };

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(tokenPayload);

      user.refreshToken = newRefreshToken;
      await user.save();

      res.json({
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired refresh token.' });
    }
  } catch (error) {
    next(error);
  }
};

// Simple in-memory or signed JWT solution for password resets.
// Let's use a secure short-lived JWT for password resets by signing with the user's password hash.
// This is stateless and automatically invalidates if the user changes their password! Very secure.

/**
 * Request forgot password link
 */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 even if user doesn't exist for security/privacy reasons, but print log
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({ message: 'If a user with this email exists, a password reset link has been sent.' });
    }

    // Generate a stateless reset token signed with a key made from (JWT_SECRET + user.passwordHash)
    const resetSecret = (process.env.JWT_ACCESS_SECRET || 'dev-access') + user.passwordHash;
    const resetToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      resetSecret,
      { expiresIn: '1h' }
    );

    await sendResetPasswordEmail(user.email, resetToken);

    res.json({ message: 'If a user with this email exists, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Decode token first to find the user ID (unverified verification since we need user password hash to verify)
    const decodedUnverified = jwt.decode(token) as { userId: string } | null;
    if (!decodedUnverified || !decodedUnverified.userId) {
      return res.status(400).json({ message: 'Invalid or malformed reset token.' });
    }

    const user = await User.findById(decodedUnverified.userId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset token (user not found).' });
    }

    // Verify token using the user-specific secret
    const resetSecret = (process.env.JWT_ACCESS_SECRET || 'dev-access') + user.passwordHash;
    try {
      jwt.verify(token, resetSecret);
    } catch (err) {
      return res.status(400).json({ message: 'Reset token is invalid or expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(password, salt);

    user.passwordHash = newPasswordHash;
    user.refreshToken = undefined; // Invalidate current logins
    await user.save();

    res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile details
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let donorProfile = null;
    if (user.donorId) {
      donorProfile = await Donor.findById(user.donorId);
    }

    res.json({
      user,
      donorProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all staff and admin accounts (ADMIN ONLY)
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({ role: { $in: ['ADMIN', 'STAFF'] } }).select('-passwordHash');
    res.json(users);
  } catch (error) {
    next(error);
  }
};
