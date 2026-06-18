import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

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
