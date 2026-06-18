import { Request, Response, NextFunction } from 'express';
import { Donation } from '../models/Donation';
import { Donor } from '../models/Donor';
import PDFDocument from 'pdfkit';

/**
 * Resolves query params to a Mongo date query object
 */
const resolveDateRange = (rangeType: string, start?: string, end?: string) => {
  const now = new Date();
  const dateQuery: any = {};

  let gteDate = new Date();
  let lteDate = new Date();

  switch (rangeType) {
    case 'daily':
      gteDate.setHours(0, 0, 0, 0);
      lteDate.setHours(23, 59, 59, 999);
      dateQuery.$gte = gteDate;
      dateQuery.$lte = lteDate;
      break;
    case 'weekly':
      gteDate.setDate(now.getDate() - 7);
      gteDate.setHours(0, 0, 0, 0);
      dateQuery.$gte = gteDate;
      break;
    case 'monthly':
      gteDate.setMonth(now.getMonth() - 1);
      gteDate.setHours(0, 0, 0, 0);
      dateQuery.$gte = gteDate;
      break;
    case 'yearly':
      gteDate.setFullYear(now.getFullYear() - 1);
      gteDate.setHours(0, 0, 0, 0);
      dateQuery.$gte = gteDate;
      break;
    case 'custom':
      if (start) {
        gteDate = new Date(start);
        gteDate.setHours(0, 0, 0, 0);
        dateQuery.$gte = gteDate;
      }
      if (end) {
        lteDate = new Date(end);
        lteDate.setHours(23, 59, 59, 999);
        dateQuery.$lte = lteDate;
      }
      break;
    default:
      // Default to last 30 days
      gteDate.setMonth(now.getMonth() - 1);
      dateQuery.$gte = gteDate;
  }
  return dateQuery;
};

/**
 * Get donation report summary JSON
 */
export const getDonationReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'monthly';
    const start = (req.query.startDate as string) || '';
    const end = (req.query.endDate as string) || '';

    const dateFilter = resolveDateRange(range, start, end);
    const query = { status: 'COMPLETED', date: dateFilter };

    const donations = await Donation.find(query)
      .populate('donorId', 'fullName mobileNumber')
      .sort({ date: -1 });

    const totalAmountResult = await Donation.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalAmount = totalAmountResult[0]?.total || 0;

    const categoryBreakdown = await Donation.aggregate([
      { $match: query },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const paymentBreakdown = await Donation.aggregate([
      { $match: query },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      summary: {
        totalAmount,
        count: donations.length,
        averageAmount: donations.length ? totalAmount / donations.length : 0,
      },
      categoryBreakdown,
      paymentBreakdown,
      donations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export donation report in CSV format
 */
export const exportDonationReportCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'monthly';
    const start = (req.query.startDate as string) || '';
    const end = (req.query.endDate as string) || '';

    const dateFilter = resolveDateRange(range, start, end);
    const query = { status: 'COMPLETED', date: dateFilter };

    const donations = await Donation.find(query)
      .populate('donorId', 'fullName mobileNumber email')
      .sort({ date: -1 });

    // Build CSV Content
    let csvContent = 'Receipt Number,Date,Donor Name,Mobile,Email,Category,Payment Method,Transaction ID,Amount\n';
    
    for (const d of donations) {
      const donor = d.donorId as any;
      const receiptNum = (d as any).receiptId ? 'Generated' : 'N/A'; // Or lookup receipt
      const dateStr = new Date(d.date).toLocaleDateString('en-IN');
      const donorName = donor ? `"${donor.fullName.replace(/"/g, '""')}"` : 'N/A';
      const mobile = donor ? donor.mobileNumber : 'N/A';
      const email = donor && donor.email ? donor.email : '';
      const category = d.category;
      const payment = d.paymentMethod;
      const txId = d.transactionId || 'N/A';
      
      csvContent += `${receiptNum},${dateStr},${donorName},${mobile},${email},${category},${payment},${txId},${d.amount}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=donation_report_${range}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Export donation report in PDF format
 */
export const exportDonationReportPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'monthly';
    const start = (req.query.startDate as string) || '';
    const end = (req.query.endDate as string) || '';

    const dateFilter = resolveDateRange(range, start, end);
    const query = { status: 'COMPLETED', date: dateFilter };

    const donations = await Donation.find(query)
      .populate('donorId', 'fullName mobileNumber')
      .sort({ date: -1 });

    const totalAmountResult = await Donation.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalAmount = totalAmountResult[0]?.total || 0;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=donation_report_${range}.pdf`);
    doc.pipe(res);

    // --- HEADER ---
    doc.fillColor('#be490e').fontSize(22).font('Helvetica-Bold').text('Shree Sawariya Seth Gau Seva Samiti', { align: 'center' });
    doc.fillColor('#475569').fontSize(10).font('Helvetica').text('Gawala Gau Seva Dal, Ganesh Road, Devali (Tonk), Rajasthan', { align: 'center' });
    doc.moveDown(1);
    
    doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text(`Donation Report Summary (${range.toUpperCase()})`);
    doc.fontSize(9).font('Helvetica').text(`Generated on: ${new Date().toLocaleString('en-IN')}`);
    doc.text(`Report Period: ${start ? start : 'Beginning'} to ${end ? end : 'Present'}`);
    doc.moveDown(1);

    // --- STATS BOARD ---
    doc.rect(40, doc.y, doc.page.width - 80, 50).fillColor('#f8fafc').fillAndStroke('#cbd5e1');
    doc.fillColor('#be490e').font('Helvetica-Bold').fontSize(12).text('TOTAL DONATIONS', 60, doc.y + 12);
    doc.fillColor('#0f172a').fontSize(16).text(`INR ${totalAmount.toLocaleString('en-IN')}/-`, 60, doc.y + 2);
    
    doc.fillColor('#be490e').fontSize(12).text('TOTAL TRANSACTIONS', 320, doc.y - 20);
    doc.fillColor('#0f172a').fontSize(16).text(`${donations.length}`, 320, doc.y + 2);
    
    doc.moveDown(3.5);

    // --- TABLE OF TRANSACTIONS ---
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Transaction History');
    doc.moveDown(0.5);

    const tableY = doc.y;
    doc.rect(40, tableY, doc.page.width - 80, 20).fillColor('#be490e').fill();
    doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
    doc.text('Date', 45, tableY + 6);
    doc.text('Donor Name', 110, tableY + 6);
    doc.text('Category', 260, tableY + 6);
    doc.text('Method', 380, tableY + 6);
    doc.text('Amount', 480, tableY + 6);

    let rowY = tableY + 20;
    doc.fillColor('#0f172a').font('Helvetica').fontSize(8);

    for (const d of donations) {
      if (rowY > doc.page.height - 60) {
        doc.addPage();
        rowY = 40;
        doc.rect(40, rowY, doc.page.width - 80, 20).fillColor('#be490e').fill();
        doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
        doc.text('Date', 45, rowY + 6);
        doc.text('Donor Name', 110, rowY + 6);
        doc.text('Category', 260, rowY + 6);
        doc.text('Method', 380, rowY + 6);
        doc.text('Amount', 480, rowY + 6);
        rowY += 20;
        doc.fillColor('#0f172a').font('Helvetica').fontSize(8);
      }

      const donor = d.donorId as any;
      const dateStr = new Date(d.date).toLocaleDateString('en-IN');
      const donorName = donor ? donor.fullName : 'Anonymous';
      const category = d.category.replace('_', ' ');
      const payment = d.paymentMethod;
      const amountStr = `INR ${d.amount.toLocaleString('en-IN')}`;

      // Alternate row backgrounds
      if ((donations.indexOf(d) % 2) === 1) {
        doc.rect(40, rowY, doc.page.width - 80, 18).fillColor('#f8fafc').fill();
        doc.fillColor('#0f172a');
      }

      doc.text(dateStr, 45, rowY + 5);
      doc.text(donorName, 110, rowY + 5, { width: 140, height: 10 });
      doc.text(category, 260, rowY + 5);
      doc.text(payment, 380, rowY + 5);
      doc.text(amountStr, 480, rowY + 5);

      rowY += 18;
    }

    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Get donor engagement stats report
 */
export const getDonorReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const range = (req.query.range as string) || 'monthly';
    const start = (req.query.startDate as string) || '';
    const end = (req.query.endDate as string) || '';

    const dateFilter = resolveDateRange(range, start, end);

    // 1. New Donors (Profiles created within date range)
    const newDonors = await Donor.find({ createdAt: dateFilter })
      .sort({ createdAt: -1 })
      .limit(10);
    const newDonorsCount = await Donor.countDocuments({ createdAt: dateFilter });

    // 2. Active Donors (Total donors who made donations in range)
    const activeDonorIds = await Donation.distinct('donorId', {
      status: 'COMPLETED',
      date: dateFilter,
    });
    const activeDonors = await Donor.find({ _id: { $in: activeDonorIds } }).limit(10);

    // 3. Top Donors (Ranked by aggregate amount in date range)
    const topDonorsResult = await Donation.aggregate([
      { $match: { status: 'COMPLETED', date: dateFilter } },
      { $group: { _id: '$donorId', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    const topDonors = [];
    for (const d of topDonorsResult) {
      const donor = await Donor.findById(d._id);
      if (donor) {
        topDonors.push({
          donor,
          totalAmount: d.totalAmount,
          donationCount: d.count,
        });
      }
    }

    res.json({
      summary: {
        newDonorsCount,
        activeDonorsCount: activeDonorIds.length,
      },
      newDonors,
      activeDonors,
      topDonors,
    });
  } catch (error) {
    next(error);
  }
};
