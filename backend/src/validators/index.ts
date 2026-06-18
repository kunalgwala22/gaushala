import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'DONOR']).default('DONOR'),
  donorId: z.string().optional(),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be a 10-digit number').optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const donorSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be a 10-digit number').optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be a 6-digit number').optional().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN Number format (e.g. ABCDE1234F)').optional().or(z.literal('')),
  aadhaarNumber: z.string().regex(/^[0-9]{12}$/, 'Aadhaar Number must be a 12-digit number').optional().or(z.literal('')),
  donationPreference: z.string().optional(),
  notes: z.string().optional(),
});

export const donationSchema = z.object({
  donorId: z.string().min(1, 'Donor is required'),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['ONE_TIME', 'MONTHLY', 'HALF_YEARLY', 'YEARLY', 'CUSTOM']).default('ONE_TIME'),
  category: z.enum([
    'GENERAL',
    'COW_FEEDING',
    'MEDICAL_SUPPORT',
    'COW_ADOPTION',
    'SHELTER_MAINTENANCE',
    'FESTIVAL',
    'GAU_SEVA',
  ]).default('GENERAL'),
  paymentMethod: z.enum(['CASH', 'CHEQUE', 'UPI', 'BANK_TRANSFER', 'OTHER']).default('CASH'),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
  date: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  status: z.enum(['COMPLETED', 'PENDING', 'FAILED']).default('COMPLETED'),
});

export const cowSchema = z.object({
  name: z.string().min(1, 'Cow name is required'),
  tagNumber: z.string().min(3, 'Tag number must be at least 3 characters'),
  breed: z.string().min(2, 'Breed is required'),
  gender: z.enum(['MALE', 'FEMALE']),
  age: z.number().nonnegative('Age must be a positive number'),
  healthStatus: z.enum(['HEALTHY', 'UNDER_TREATMENT', 'CRITICAL', 'RECOVERING']).default('HEALTHY'),
  photoUrl: z.string().optional(),
  shelterNumber: z.string().min(1, 'Shelter number is required'),
});

export const sponsorshipSchema = z.object({
  donorId: z.string().min(1, 'Donor is required'),
  cowId: z.string().min(1, 'Cow is required'),
  amount: z.number().positive('Sponsorship amount must be positive'),
  startDate: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  endDate: z.string().transform((val) => new Date(val)),
});
