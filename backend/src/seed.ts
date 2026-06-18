import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { User } from './models/User';
import { Donor } from './models/Donor';
import { Donation } from './models/Donation';
import { Receipt } from './models/Receipt';
import { Cow } from './models/Cow';
import { Sponsorship } from './models/Sponsorship';
import { RecurringDonation } from './models/RecurringDonation';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gaushala';

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Clear existing data
    console.log('Clearing database collections...');
    await User.deleteMany({});
    await Donor.deleteMany({});
    await Donation.deleteMany({});
    await Receipt.deleteMany({});
    await Cow.deleteMany({});
    await Sponsorship.deleteMany({});
    await RecurringDonation.deleteMany({});
    console.log('Database cleared.');

    // Clear uploads folders
    console.log('Cleaning local upload directories...');
    const receiptsDir = path.join(__dirname, '../uploads/receipts');
    if (fs.existsSync(receiptsDir)) {
      const files = fs.readdirSync(receiptsDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(receiptsDir, file));
        } catch (e) {}
      }
    }
    const cowsDir = path.join(__dirname, '../uploads/cows');
    if (fs.existsSync(cowsDir)) {
      const files = fs.readdirSync(cowsDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(cowsDir, file));
        } catch (e) {}
      }
    }
    console.log('Upload directories cleaned.');

    // 1. Create Default Users
    console.log('Creating admin and staff login accounts...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('admin123', salt);
    const staffPassword = await bcrypt.hash('staff123', salt);

    const adminUser = new User({
      name: 'Gaushala Admin',
      email: 'admin@gaushala.com',
      passwordHash: defaultPassword,
      role: 'ADMIN',
    });
    await adminUser.save();

    const staffUser = new User({
      name: 'Gaushala Operator',
      email: 'staff@gaushala.com',
      passwordHash: staffPassword,
      role: 'STAFF',
    });
    await staffUser.save();

    console.log('Default accounts successfully created:');
    console.log('Admin: admin@gaushala.com / admin123');
    console.log('Staff: staff@gaushala.com / staff123');

    console.log('Database reset completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
