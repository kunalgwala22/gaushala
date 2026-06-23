import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

import { connectDB } from './config/db';
import { errorHandler } from './middleware/error';
import { apiRateLimiter } from './middleware/rateLimiter';

// Import Routes
import authRoutes from './routes/authRoutes';
import donorRoutes from './routes/donorRoutes';
import donationRoutes from './routes/donationRoutes';
import cowRoutes from './routes/cowRoutes';
import sponsorshipRoutes from './routes/sponsorshipRoutes';
import reportRoutes from './routes/reportRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows frontend to access local static PDF files/images
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API endpoints
app.use('/api', apiRateLimiter);

// Serve static uploads (receipts, cow photos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static('/tmp/uploads'));

// On-the-fly PDF receipt generator and serving middleware for Vercel/serverless environments
app.get('/uploads/receipts/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const localPath = path.join(__dirname, '../uploads/receipts', filename);
    const tmpPath = path.join('/tmp/uploads/receipts', filename);

    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }
    if (fs.existsSync(tmpPath)) {
      return res.sendFile(tmpPath);
    }

    const match = filename.match(/^RECEIPT_(SSSG_[0-9-]+_[0-9]+)\.pdf$/);
    if (!match) {
      return next();
    }

    const receiptNumber = match[1].replace(/_/g, '/');

    // Import models and service dynamically to avoid circular dependencies
    const { Receipt } = await import('./models/Receipt');
    const { generateReceiptPDF } = await import('./services/pdfService');

    const receipt = await Receipt.findOne({ receiptNumber }).populate({
      path: 'donationId',
      populate: { path: 'donorId' }
    });

    if (!receipt || !receipt.donationId) {
      return res.status(404).json({ message: 'Receipt not found.' });
    }

    const donation: any = receipt.donationId;
    const donor = donation.donorId;
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found.' });
    }

    await generateReceiptPDF({
      receiptNumber: receipt.receiptNumber,
      donorName: donor.fullName,
      mobileNumber: donor.mobileNumber,
      panNumber: donor.panNumber,
      address: `${donor.address}, ${donor.city}, ${donor.state} - ${donor.pincode}`,
      amount: donation.amount,
      category: donation.category,
      paymentMethod: donation.paymentMethod,
      transactionId: donation.transactionId,
      date: donation.date,
    });

    if (fs.existsSync(tmpPath)) {
      return res.sendFile(tmpPath);
    }
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }

    return res.status(500).json({ message: 'Failed to generate PDF on the fly.' });
  } catch (error) {
    next(error);
  }
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/cows', cowRoutes);
app.use('/api/sponsorships', sponsorshipRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Shree Sawariya Seth Gaushala Management API is running.' });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

export default app;
