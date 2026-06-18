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
 * Helper to write mixed Devanagari and Latin text in PDFKit
 */
function writeMixedText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  options: {
    isBold?: boolean;
    width?: number;
    height?: number;
    ellipsis?: boolean;
    align?: string;
  } = {}
) {
  // Regex matches segments of Devanagari characters (and whitespace between them)
  // or segments of non-Devanagari characters.
  const regex = /([\u0900-\u097F\s]+|[^\u0900-\u097F]+)/g;
  const matches = text.match(regex) || [text];
  const isBold = options.isBold || false;

  for (let i = 0; i < matches.length; i++) {
    const part = matches[i];
    const isDevan = /[\u0900-\u097F]/.test(part);
    const font = isDevan
      ? (isBold ? 'Devanagari-Bold' : 'Devanagari')
      : (isBold ? 'Helvetica-Bold' : 'Helvetica');

    doc.font(font);
    const isLast = i === matches.length - 1;

    const textOptions: any = {
      continued: !isLast,
    };
    if (options.width !== undefined) textOptions.width = options.width;
    if (options.height !== undefined) textOptions.height = options.height;
    if (options.ellipsis !== undefined) textOptions.ellipsis = options.ellipsis;
    if (options.align !== undefined) textOptions.align = options.align;

    if (i === 0) {
      doc.text(part, x, y, textOptions);
    } else {
      doc.text(part, textOptions);
    }
  }
}

/**
 * Generates a professional traditional Indian PDF receipt matching the physical design
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
      const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margin: 25 });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Register Devanagari Fonts
      const regularFontPath = '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf';
      const boldFontPath = '/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf';
      
      doc.registerFont('Devanagari', regularFontPath);
      doc.registerFont('Devanagari-Bold', boldFontPath);

      // --- 1. PINK PAPER BACKGROUND ---
      // Draw background fill for the entire A5 page
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffd6e0');

      // --- 2. CRIMSON BORDERS ---
      // Outer border
      doc.rect(15, 15, doc.page.width - 30, doc.page.height - 30).lineWidth(1.8).strokeColor('#881337').stroke();
      // Inner border
      doc.rect(17.5, 17.5, doc.page.width - 35, doc.page.height - 35).lineWidth(0.6).strokeColor('#881337').stroke();

      // --- 3. CORNER STAMP IMAGES ---
      // Left stamp: Shree Sawaliya Seth
      const sawaliyaSethPath = path.join(__dirname, '../assets/sawaliya_seth.png');
      if (fs.existsSync(sawaliyaSethPath)) {
        doc.image(sawaliyaSethPath, 25, 23, { width: 45, height: 60 });
      }

      // Right stamp: Cow Logo
      const cowLogoPath = path.join(__dirname, '../assets/cow_logo.png');
      if (fs.existsSync(cowLogoPath)) {
        doc.image(cowLogoPath, doc.page.width - 80, 23, { width: 55, height: 55 });
      }

      // --- 4. TOP RELIGIOUS SLOGANS ---
      doc.font('Devanagari-Bold').fontSize(8.5).fillColor('#be123c');
      doc.text('|| जय श्री राम ||', 85, 24, { width: 100, align: 'center' });
      doc.text('|| श्री गणेशाय नमः ||', (doc.page.width - 150) / 2, 24, { width: 150, align: 'center' });
      doc.text('|| जय माता दी ||', doc.page.width - 185, 24, { width: 100, align: 'center' });

      // --- 5. MAIN HEADERS ---
      // Title
      doc.fontSize(19).fillColor('#881337').text('श्री सावलिया सेठ गौ सेवा समिति', 80, 36, { width: doc.page.width - 160, align: 'center' });
      
      // Subtitle
      doc.font('Devanagari').fontSize(10).fillColor('#374151');
      doc.text('संरक्षक - ग्वाला गौ सेवा दल , गणेश रोड़, देवली (टोंक)', 80, 57, { width: doc.page.width - 160, align: 'center' });

      // Registration Number (Mixed Font Centering)
      const hindiReg = 'पंजीयन संख्या / ';
      const englishReg = 'REG. NO. COOP/2023/TONK/205754';
      
      doc.font('Devanagari-Bold').fontSize(8.5);
      const w1 = doc.widthOfString(hindiReg);
      doc.font('Helvetica-Bold').fontSize(8.5);
      const w2 = doc.widthOfString(englishReg);
      
      const regStartX = (doc.page.width - (w1 + w2)) / 2;
      doc.font('Devanagari-Bold').fillColor('#4b5563')
         .text(hindiReg, regStartX, 71, { continued: true })
         .font('Helvetica-Bold').text(englishReg);

      // Divider Line
      doc.moveTo(22, 85).lineTo(doc.page.width - 22, 85).lineWidth(1.2).strokeColor('#be123c').stroke();

      // --- 6. RECEIPT NUMBER & DATE ROW ---
      // Receipt Number (रसीद नं.)
      const seqStr = data.receiptNumber.split('/').pop() || data.receiptNumber;
      doc.font('Devanagari-Bold').fontSize(12).fillColor('#be123c');
      doc.text('रसीद नं.', 25, 93);
      doc.font('Helvetica-Bold').fontSize(13).text(seqStr, 75, 92);

      // Date (दिनांक)
      doc.font('Devanagari-Bold').fontSize(11).fillColor('#374151');
      doc.text('दिनांक:', doc.page.width - 150, 93);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#0f172a').text(new Date(data.date).toLocaleDateString('en-IN'), doc.page.width - 110, 92);

      // --- 7. HANDWRITTEN-STYLE PARTICULARS ---
      // Field: श्रीमान् (Donor Name)
      let y = 118;
      doc.font('Devanagari').fontSize(11).fillColor('#374151');
      doc.text('श्रीमान्', 25, y);
      
      // Mixed Devanagari/Latin rendering for donorName
      writeMixedText(doc, data.donorName, 80, y - 1, { isBold: true });
      
      // Underline for name
      doc.moveTo(75, y + 14).lineTo(doc.page.width - 25, y + 14).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#9ca3af').stroke().undash();

      // Field: निवासी (Address) & सेरूपयें (Amount in Words)
      y += 24;
      doc.font('Devanagari').fontSize(11).fillColor('#374151');
      doc.text('निवासी', 25, y);
      
      // Mixed Devanagari/Latin rendering for address
      writeMixedText(doc, data.address || 'देवली', 80, y - 1, { width: 140, height: 18, ellipsis: true, isBold: true });
      
      doc.font('Devanagari').fillColor('#374151').text('सेरूपयें', 230, y);
      const words = numberToWords(data.amount);
      
      // Mixed Devanagari/Latin rendering for words
      writeMixedText(doc, words, 280, y - 1, { width: doc.page.width - 305, height: 18, ellipsis: true, isBold: true });
      
      // Underlines for resident and words
      doc.moveTo(75, y + 14).lineTo(220, y + 14).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#9ca3af').stroke().undash();
      doc.moveTo(275, y + 14).lineTo(doc.page.width - 25, y + 14).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#9ca3af').stroke().undash();

      // Field: बाबत (Category/Purpose) & Thank You Slogan
      y += 24;
      doc.font('Devanagari').fontSize(11).fillColor('#374151');
      doc.text('बाबत', 25, y);
      
      // Map category to Hindi equivalent
      const getCategoryHindi = (cat: string) => {
        switch (cat) {
          case 'GENERAL': return 'सहयोग';
          case 'COW_FEEDING': return 'गौ ग्रास / चारा सेवा';
          case 'MEDICAL_SUPPORT': return 'गौ चिकित्सा सेवा';
          case 'COW_ADOPTION': return 'गौ गोद सेवा';
          case 'SHELTER_MAINTENANCE': return 'आवास रख-रखाव';
          case 'FESTIVAL': return 'उत्सव सेवा दान';
          case 'GAU_SEVA': return 'गौ सेवा संकल्प';
          default: return cat;
        }
      };
      
      // Mixed Devanagari/Latin rendering for category
      writeMixedText(doc, getCategoryHindi(data.category), 80, y - 1, { isBold: true });
      
      doc.font('Devanagari').fontSize(11).fillColor('#374151').text('हेतु सधन्यवाद प्राप्त हुयें।', doc.page.width - 170, y);
      // Underline for category
      doc.moveTo(75, y + 14).lineTo(doc.page.width - 180, y + 14).lineWidth(0.5).dash(2, { space: 2 }).strokeColor('#9ca3af').stroke().undash();

      // --- 8. BOTTOM BOXES & SIGNATURES ---
      // Rs. Box
      doc.rect(25, 198, 120, 32).lineWidth(1.5).strokeColor('#881337').stroke();
      doc.rect(26, 199, 118, 30).fill('#ffffff');
      doc.font('Devanagari-Bold').fontSize(13.5).fillColor('#881337').text('रु.', 32, 206);
      doc.font('Helvetica-Bold').fontSize(14).text(`${data.amount}/-`, 55, 206);

      // Payment Details
      doc.font('Courier-BoldOblique').fontSize(14).fillColor('#1e1b4b').text(data.paymentMethod.toLowerCase(), 160, 206);
      if (data.transactionId) {
        doc.font('Helvetica').fontSize(7.5).fillColor('#4b5563').text(`Txn: ${data.transactionId}`, 160, 222);
      }

      // Signature Area (हस्ताक्षर)
      doc.font('Devanagari').fontSize(9).fillColor('#4b5563');
      doc.text('हस्ताक्षर', doc.page.width - 90, 222);
      // Simulated signature
      doc.font('Courier-BoldOblique').fontSize(12).fillColor('#1e1b4b').text('Shaly', doc.page.width - 95, 205);

      // --- 9. CONTACT LINE (Mixed Font Centering) ---
      doc.moveTo(22, 240).lineTo(doc.page.width - 22, 240).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      
      const contactLabel = 'संपर्क सूत्र (टोंक गौशाला): ';
      const contactNumbers = '8905859570, 8003445051, 9119284593, 9529266713, 9636098819, 9251827092';
      
      doc.font('Devanagari').fontSize(8);
      const cw1 = doc.widthOfString(contactLabel);
      doc.font('Helvetica').fontSize(8);
      const cw2 = doc.widthOfString(contactNumbers);
      
      const cTotalWidth = cw1 + cw2;
      const cStartX = (doc.page.width - cTotalWidth) / 2;
      
      doc.font('Devanagari').fillColor('#6b7280')
         .text(contactLabel, cStartX, 246, { continued: true })
         .font('Helvetica').text(contactNumbers);

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
