import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { numberToWords } from '../utils/numberToWords';

interface PDFReceiptInput {
  receiptNumber: string;
  donorName: string;
  mobileNumber: string;
  panNumber?: string;
  address: string;
  amount: number;
  category: string;
  paymentMethod: string;
  transactionId?: string;
  date: Date;
}

/**
 * Generates a professional PDF receipt for a donation and returns its file path
 */
export async function generateReceiptPDF(data: PDFReceiptInput): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const dirPath = path.join(__dirname, '../../uploads/receipts');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const fileName = `RECEIPT_${data.receiptNumber.replace(/\//g, '_')}.pdf`;
      const filePath = path.join(dirPath, fileName);
      const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 30 });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // --- STYLISH BORDERS ---
      // Outer border
      doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30).lineWidth(2).strokeColor('#be490e').stroke(); // Saffron outline
      // Inner border
      doc.rect(19, 19, doc.page.width - 38, doc.page.height - 38).lineWidth(0.5).strokeColor('#e56410').stroke();

      // --- HEADER ---
      // Logo placeholder (drawn cow shape or symbol)
      doc.fillColor('#be490e');
      doc.ellipse(55, 50, 25, 20).fill();
      doc.fillColor('#ffffff').fontSize(14).text('🐄', 43, 40);

      // Trust Title
      doc.fillColor('#be490e')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text('SHREE SAWARIYA SETH GAUSHALA', 90, 35);

      // Trust Subtitle/Reg Info
      doc.fillColor('#475569')
         .fontSize(8)
         .font('Helvetica')
         .text('Reg No: SSSG/RAJ/2022-7890 | Registered Gau Seva Trust', 90, 55)
         .text('Address: Near Seth Ji Temple, Chittorgarh, Rajasthan - 312001 | Contact: +91 98765 43210', 90, 68);

      // Divider Line
      doc.moveTo(25, 85).lineTo(doc.page.width - 25, 85).lineWidth(1).strokeColor('#cbd5e1').stroke();

      // --- RECEIPT & DATE INFO ---
      doc.fillColor('#be490e')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('DONATION RECEIPT', 30, 95);

      doc.fillColor('#475569')
         .fontSize(9)
         .font('Helvetica')
         .text(`Receipt No: `, 30, 115)
         .font('Helvetica-Bold').fillColor('#0f172a').text(data.receiptNumber, 90, 115)
         
         .font('Helvetica').fillColor('#475569').text(`Date: `, doc.page.width - 150, 115)
         .font('Helvetica-Bold').fillColor('#0f172a').text(new Date(data.date).toLocaleDateString('en-IN'), doc.page.width - 110, 115);

      // --- DONOR PARTICULARS ---
      doc.rect(30, 135, (doc.page.width - 70) / 2 - 10, 105).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      
      // Header for Donor Box
      doc.fillColor('#be490e').font('Helvetica-Bold').fontSize(9).text('Donor Details', 35, 142);
      
      let donorTextY = 158;
      doc.fillColor('#475569').font('Helvetica').fontSize(8.5);
      doc.text(`Name:`, 35, donorTextY);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(data.donorName, 80, donorTextY);
      
      donorTextY += 16;
      doc.fillColor('#475569').font('Helvetica').text(`Mobile:`, 35, donorTextY);
      doc.fillColor('#0f172a').text(data.mobileNumber, 80, donorTextY);
      
      donorTextY += 16;
      doc.fillColor('#475569').text(`PAN:`, 35, donorTextY);
      doc.fillColor('#0f172a').text(data.panNumber || 'N/A', 80, donorTextY);
      
      donorTextY += 16;
      doc.fillColor('#475569').text(`Address:`, 35, donorTextY);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(data.address, 80, donorTextY, { width: 140, height: 20 });

      // --- DONATION PARTICULARS ---
      const rightBoxX = (doc.page.width - 70) / 2 + 35;
      doc.rect(rightBoxX, 135, (doc.page.width - 70) / 2 + 5, 105).lineWidth(0.5).strokeColor('#cbd5e1').stroke();

      // Header for Donation Box
      doc.fillColor('#be490e').font('Helvetica-Bold').fontSize(9).text('Donation Details', rightBoxX + 5, 142);

      let donationTextY = 158;
      doc.fillColor('#475569').font('Helvetica').fontSize(8.5);
      doc.text(`Category:`, rightBoxX + 5, donationTextY);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(data.category.replace('_', ' '), rightBoxX + 60, donationTextY);

      donationTextY += 16;
      doc.fillColor('#475569').font('Helvetica').text(`Mode:`, rightBoxX + 5, donationTextY);
      doc.fillColor('#0f172a').text(data.paymentMethod, rightBoxX + 60, donationTextY);

      donationTextY += 16;
      doc.fillColor('#475569').text(`Txn ID:`, rightBoxX + 5, donationTextY);
      doc.fillColor('#0f172a').text(data.transactionId || 'N/A', rightBoxX + 60, donationTextY);

      donationTextY += 16;
      doc.fillColor('#475569').text(`Amount:`, rightBoxX + 5, donationTextY);
      doc.fillColor('#be490e').font('Helvetica-Bold').fontSize(11).text(`INR ${data.amount.toLocaleString('en-IN')}/-`, rightBoxX + 60, donationTextY - 1);

      // --- AMOUNT IN WORDS ---
      doc.rect(30, 250, doc.page.width - 60, 24).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text('Amount in words: ', 35, 258);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(numberToWords(data.amount), 120, 258);

      // --- SIGNATURE AND THANKS ---
      // Slogan/Quote
      doc.fillColor('#be490e')
         .fontSize(9)
         .font('Helvetica-Oblique')
         .text('“Serving Cows is Serving Lord Krishna. Thank you for your generous support.”', 30, 282, { width: 300 });

      // Cursive digital signature simulation
      doc.fillColor('#0f172a')
         .font('Courier-BoldOblique')
         .fontSize(12)
         .text('Shree Sawariya Seth', doc.page.width - 170, 276);
      
      // Signature line and label
      doc.moveTo(doc.page.width - 180, 290).lineTo(doc.page.width - 30, 290).lineWidth(0.5).strokeColor('#64748b').stroke();
      doc.fillColor('#475569')
         .fontSize(7.5)
         .font('Helvetica-Bold')
         .text('Authorized Signatory', doc.page.width - 140, 294);

      doc.end();

      writeStream.on('finish', () => {
        resolve(`/uploads/receipts/${fileName}`);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}
