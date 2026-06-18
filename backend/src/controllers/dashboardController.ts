import { Request, Response, NextFunction } from 'express';
import { Donation } from '../models/Donation';
import { Donor } from '../models/Donor';
import { Cow } from '../models/Cow';
import { Sponsorship } from '../models/Sponsorship';

/**
 * Get aggregated dashboard analytics
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    
    // 1. Calculate Stats Cards
    // Total Donations
    const totalDonationsResult = await Donation.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalDonations = totalDonationsResult[0]?.total || 0;

    // Monthly Donations (this calendar month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyDonationsResult = await Donation.aggregate([
      { $match: { status: 'COMPLETED', date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyDonations = monthlyDonationsResult[0]?.total || 0;

    // Active Donors (donated in the last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const activeDonorsResult = await Donation.distinct('donorId', {
      status: 'COMPLETED',
      date: { $gte: oneYearAgo },
    });
    const activeDonorsCount = activeDonorsResult.length;

    // Total Cows
    const totalCowsCount = await Cow.countDocuments();

    // Active Sponsorships
    const activeSponsorshipsCount = await Sponsorship.countDocuments({ status: 'ACTIVE' });

    // 2. Donation Trend (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const trendResult = await Donation.aggregate([
      { $match: { status: 'COMPLETED', date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          amount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Format trend data for Recharts (e.g. { name: 'Jan', amount: 5000 })
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed

      const matched = trendResult.find((t) => t._id.year === year && t._id.month === month);
      trendData.push({
        name: `${monthNames[d.getMonth()]} ${year.toString().slice(-2)}`,
        amount: matched ? matched.amount : 0,
      });
    }

    // 3. Category Distribution (Pie Chart)
    const categoryResult = await Donation.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: '$category', value: { $sum: '$amount' } } },
    ]);
    const categoryData = categoryResult.map((c) => ({
      name: c._id.replace('_', ' '),
      value: c.value,
    }));

    // 4. Top Donors (Bar Chart)
    const topDonorsResult = await Donation.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: '$donorId', totalAmount: { $sum: '$amount' } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
    ]);

    // Populate donor names
    const topDonorsData = [];
    for (const d of topDonorsResult) {
      const donor = await Donor.findById(d._id).select('fullName');
      topDonorsData.push({
        name: donor ? donor.fullName : 'Anonymous',
        amount: d.totalAmount,
      });
    }

    // 5. Cow Health Status Distribution
    const healthResult = await Cow.aggregate([
      { $group: { _id: '$healthStatus', count: { $sum: 1 } } },
    ]);
    const healthData = healthResult.map((h) => ({
      status: h._id,
      count: h.count,
    }));

    res.json({
      cards: {
        totalDonations,
        monthlyDonations,
        activeDonors: activeDonorsCount,
        totalCows: totalCowsCount,
        activeSponsorships: activeSponsorshipsCount,
      },
      trend: trendData,
      categories: categoryData,
      topDonors: topDonorsData,
      healthStats: healthData,
    });
  } catch (error) {
    next(error);
  }
};
