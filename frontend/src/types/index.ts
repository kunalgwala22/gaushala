export type UserRole = 'ADMIN' | 'STAFF' | 'DONOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  donorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donor {
  _id: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  panNumber?: string;
  aadhaarNumber?: string; // Decrypted on the fly for authorized roles
  donationPreference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DonationType = 'ONE_TIME' | 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY' | 'CUSTOM';
export type DonationCategory = 
  | 'GENERAL' 
  | 'COW_FEEDING' 
  | 'MEDICAL_SUPPORT' 
  | 'COW_ADOPTION' 
  | 'SHELTER_MAINTENANCE' 
  | 'FESTIVAL' 
  | 'GAU_SEVA';
export type PaymentMethod = 'CASH' | 'CHEQUE' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';

export interface Receipt {
  _id: string;
  receiptNumber: string;
  donationId: string;
  pdfUrl: string;
  generatedAt: string;
}

export interface Donation {
  _id: string;
  donorId: Donor;
  amount: number;
  type: DonationType;
  category: DonationCategory;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  date: string;
  receiptId?: Receipt;
  recurringId?: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
  updatedAt: string;
}

export type HealthStatus = 'HEALTHY' | 'UNDER_TREATMENT' | 'CRITICAL' | 'RECOVERING';
export type CowGender = 'MALE' | 'FEMALE';

export interface Cow {
  _id: string;
  name: string;
  tagNumber: string;
  breed: string;
  gender: CowGender;
  age: number;
  healthStatus: HealthStatus;
  photoUrl?: string;
  shelterNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sponsorship {
  _id: string;
  donorId: Donor;
  cowId: Cow;
  amount: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

export interface RecurringDonation {
  _id: string;
  donorId: Donor;
  amount: number;
  category: DonationCategory;
  frequency: 'MONTHLY' | 'HALF_YEARLY' | 'YEARLY';
  startDate: string;
  nextDueDate: string;
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  cards: {
    totalDonations: number;
    monthlyDonations: number;
    activeDonors: number;
    totalCows: number;
    activeSponsorships: number;
  };
  trend: Array<{ name: string; amount: number }>;
  categories: Array<{ name: string; value: number }>;
  topDonors: Array<{ name: string; amount: number }>;
  healthStats: Array<{ status: HealthStatus; count: number }>;
}
