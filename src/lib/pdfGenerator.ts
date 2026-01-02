import jsPDF from 'jspdf';
import boltLogo from '@/assets/bolt-logo.jpg';

interface ReceiptData {
  invoiceNumber: string;
  date: string;
  time: string;
  recipient: string;
  driverName: string;
  driverCity: string;
  location: string;
  startLocation: string;
  tripFee: number;
  vat: number;
  total: number;
  paymentMethod: string;
}

export const generatePDF = async (receipts: ReceiptData[]): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');

  for (let i = 0; i < receipts.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    await generateReceiptPage(pdf, receipts[i]);
  }

  const fileName = `bolt-receipts-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

const generateReceiptPage = async (pdf: jsPDF, receipt: ReceiptData): Promise<void> => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  // Add Bolt logo
  pdf.addImage(boltLogo, 'JPEG', margin, yPosition, 30, 12);

  yPosition += 25;

  // Invoice number - centered, bold
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Invoice no. ${receipt.invoiceNumber}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 10;

  // Date on the right
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date: ${receipt.date}`, pageWidth - margin, yPosition, { align: 'right' });

  yPosition += 12;

  // Recipient label
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text('Recipient:', margin, yPosition);

  yPosition += 6;

  // Recipient name - bold
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(receipt.recipient, margin, yPosition);

  yPosition += 8;

  // Driver name
  pdf.setFont('helvetica', 'normal');
  pdf.text(receipt.driverName, margin, yPosition);

  yPosition += 6;

  // Driver city - red color
  pdf.setTextColor(180, 0, 0);
  pdf.text(receipt.driverCity, margin, yPosition);

  yPosition += 12;

  // Start location and time
  pdf.setTextColor(80, 80, 80);
  pdf.setFontSize(9);
  pdf.text(`Start: ${receipt.startLocation} (${receipt.date} ${receipt.time})`, margin, yPosition);

  yPosition += 15;

  // Table
  const tableWidth = pageWidth - margin * 2;
  const colWidths = [tableWidth * 0.4, tableWidth * 0.2, tableWidth * 0.2, tableWidth * 0.2];
  const rowHeight = 10;

  // Table header background
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, yPosition, tableWidth, rowHeight, 'F');

  // Table border
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, yPosition, tableWidth, rowHeight * 2);

  // Header row line
  pdf.line(margin, yPosition + rowHeight, margin + tableWidth, yPosition + rowHeight);

  // Vertical lines
  let xPos = margin;
  for (let i = 0; i < colWidths.length - 1; i++) {
    xPos += colWidths[i];
    pdf.line(xPos, yPosition, xPos, yPosition + rowHeight * 2);
  }

  // Header text
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  const headerY = yPosition + 7;
  pdf.text('Title', margin + 4, headerY);
  pdf.text('Sum (KES)', margin + colWidths[0] + 4, headerY);
  pdf.text('VAT 0%', margin + colWidths[0] + colWidths[1] + 4, headerY);
  pdf.text('Total sum (KES)', margin + colWidths[0] + colWidths[1] + colWidths[2] + 4, headerY);

  // Data row
  const dataY = yPosition + rowHeight + 7;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Trip Fee', margin + 4, dataY);
  pdf.text(receipt.tripFee.toFixed(2), margin + colWidths[0] + 4, dataY);
  pdf.text('0.00', margin + colWidths[0] + colWidths[1] + 4, dataY);
  pdf.text(receipt.tripFee.toFixed(2), margin + colWidths[0] + colWidths[1] + colWidths[2] + 4, dataY);

  yPosition += rowHeight * 2 + 12;

  // Summary section - right aligned
  const summaryX = pageWidth - margin - 60;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total (KES):', summaryX, yPosition);
  pdf.text(receipt.tripFee.toFixed(2), pageWidth - margin, yPosition, { align: 'right' });

  yPosition += 7;
  pdf.text('VAT 0%:', summaryX, yPosition);
  pdf.text('0.00', pageWidth - margin, yPosition, { align: 'right' });

  yPosition += 10;

  // Divider line
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(summaryX - 5, yPosition, pageWidth - margin, yPosition);

  yPosition += 8;

  // Total including VAT
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total including VAT (KES):', summaryX, yPosition);
  pdf.text(receipt.total.toFixed(2), pageWidth - margin, yPosition, { align: 'right' });

  yPosition += 20;

  // Payment section
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('Charged', margin, yPosition);

  // Green payment badge with card icon
  const badgeX = margin + 25;
  pdf.setFillColor(34, 197, 94);
  pdf.roundedRect(badgeX, yPosition - 5, 18, 8, 2, 2, 'F');
  
  // Card circles
  pdf.setFillColor(255, 255, 255);
  pdf.circle(badgeX + 5, yPosition - 1, 2, 'F');
  pdf.setFillColor(255, 200, 0);
  pdf.circle(badgeX + 9, yPosition - 1, 2, 'F');

  // Cash text and line
  pdf.setTextColor(0, 0, 0);
  pdf.text('Cash:', badgeX + 22, yPosition);
  
  // Signature line
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.line(badgeX + 35, yPosition, badgeX + 80, yPosition);
};
