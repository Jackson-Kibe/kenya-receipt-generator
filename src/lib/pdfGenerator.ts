import jsPDF from 'jspdf';

interface ReceiptData {
  invoiceNumber: string;
  date: string;
  time: string;
  recipient: string;
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
    
    const receipt = receipts[i];
    await generateReceiptPage(pdf, receipt);
  }
  
  const fileName = `bolt-receipts-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

const generateReceiptPage = async (pdf: jsPDF, receipt: ReceiptData): Promise<void> => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 30;
  
  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize: number = 10, fontStyle: string = 'normal', color: number[] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.text(text, x, y);
  };
  
  // Bolt logo background (green rectangle)
  pdf.setFillColor(34, 197, 94); // Bolt green
  pdf.rect(margin, yPosition - 15, 40, 20, 'F');
  
  // Bolt text in white
  addText('Bolt', margin + 8, yPosition - 2, 18, 'bold', [255, 255, 255]);
  
  // Invoice number and date in top right
  pdf.setTextColor(0, 0, 0);
  addText(`Invoice no. ${receipt.invoiceNumber}`, pageWidth - margin - 80, yPosition - 5, 10, 'bold');
  addText(`Date: ${receipt.date}`, pageWidth - margin - 80, yPosition + 5, 9);
  
  yPosition += 30;
  
  // Recipient section
  addText('Recipient:', margin, yPosition, 10, 'bold');
  yPosition += 8;
  addText(receipt.recipient, margin, yPosition, 10);
  
  // Location on the right side
  addText(receipt.location, pageWidth - margin - 80, yPosition, 9);
  yPosition += 20;
  
  // Start location and time
  addText(`Start: ${receipt.startLocation} (${receipt.date} ${receipt.time})`, margin, yPosition, 9);
  yPosition += 30;
  
  // Table setup
  const tableStartY = yPosition;
  const tableWidth = pageWidth - 2 * margin;
  const tableHeight = 40;
  const rowHeight = 12;
  
  // Table border
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, tableStartY, tableWidth, tableHeight);
  
  // Header row background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, tableStartY, tableWidth, rowHeight, 'F');
  
  // Column positions
  const col1X = margin + 5;
  const col2X = margin + 80;
  const col3X = margin + 120;
  const col4X = margin + 150;
  
  // Vertical lines
  pdf.line(margin + 75, tableStartY, margin + 75, tableStartY + tableHeight);
  pdf.line(margin + 115, tableStartY, margin + 115, tableStartY + tableHeight);
  pdf.line(margin + 145, tableStartY, margin + 145, tableStartY + tableHeight);
  
  // Header text
  addText('Title', col1X, tableStartY + 8, 9, 'bold');
  addText('Sum (KES)', col2X, tableStartY + 8, 9, 'bold');
  addText('VAT 0%', col3X, tableStartY + 8, 9, 'bold');
  addText('Total sum (KES)', col4X, tableStartY + 8, 9, 'bold');
  
  // Horizontal line under header
  pdf.line(margin, tableStartY + rowHeight, pageWidth - margin, tableStartY + rowHeight);
  
  // Data row
  addText('Trip Fee', col1X, tableStartY + 24, 9);
  addText(receipt.tripFee.toFixed(2), col2X, tableStartY + 24, 9);
  addText('0.00', col3X, tableStartY + 24, 9);
  addText(receipt.tripFee.toFixed(2), col4X, tableStartY + 24, 9);
  
  yPosition = tableStartY + tableHeight + 20;
  
  // Summary section (right aligned)
  const summaryX = pageWidth - margin - 80;
  addText(`Total (KES):`, summaryX - 20, yPosition, 10);
  addText(receipt.tripFee.toFixed(2), summaryX + 20, yPosition, 10);
  yPosition += 8;
  addText(`VAT 0%:`, summaryX - 20, yPosition, 10);
  addText('0.00', summaryX + 20, yPosition, 10);
  yPosition += 8;
  addText(`Total including VAT (KES):`, summaryX - 20, yPosition, 10, 'bold');
  addText(receipt.total.toFixed(2), summaryX + 20, yPosition, 10, 'bold');
  yPosition += 20;
  
  // Payment information
  addText(`Paid by KES${receipt.tripFee.toFixed(2)}KES7569:`, margin, yPosition, 9);
  addText(`-${receipt.tripFee.toFixed(2)}`, margin + 80, yPosition, 9);
  yPosition += 15;
  
  // Payment method with visual indicators
  addText('Charged', margin, yPosition, 9, 'bold');
  
  // Add red dot for charged
  pdf.setFillColor(255, 0, 0);
  pdf.circle(margin + 35, yPosition - 2, 1.5, 'F');
  
  addText('Cash', margin + 60, yPosition, 9, 'bold');
  
  // Payment method icons (simplified rectangles with text)
  pdf.setFillColor(220, 220, 220);
  pdf.rect(margin + 90, yPosition - 6, 20, 8, 'F');
  pdf.rect(margin + 115, yPosition - 6, 20, 8, 'F');
  
  // Add card and cash symbols
  pdf.setTextColor(0, 0, 0);
  addText('💳', margin + 95, yPosition, 8);
  addText('💰', margin + 120, yPosition, 8);
  
  yPosition += 30;
  
  // Reset text color for any additional content
  pdf.setTextColor(0, 0, 0);
};