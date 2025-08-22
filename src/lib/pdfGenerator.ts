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
  
  // Bolt logo with modern styling
  pdf.setFillColor(52, 211, 153); // Bolt green
  pdf.roundedRect(margin, yPosition - 15, 45, 22, 3, 3, 'F');
  
  // Bolt text with better typography
  addText('Bolt', margin + 12, yPosition - 2, 20, 'bold', [255, 255, 255]);
  
  // Add small dot after Bolt (characteristic of the logo)
  pdf.setFillColor(255, 255, 255);
  pdf.circle(margin + 38, yPosition + 1, 1.5, 'F');
  
  // Invoice number and date in top right
  pdf.setTextColor(0, 0, 0);
  addText(`Invoice no. ${receipt.invoiceNumber}`, pageWidth - margin - 60, yPosition - 8, 11, 'bold');
  addText(`Date: ${receipt.date}`, pageWidth - margin - 60, yPosition + 2, 10);
  
  yPosition += 30;
  
  // Recipient section with better spacing
  addText('Recipient:', margin, yPosition, 11, 'bold');
  yPosition += 10;
  addText(receipt.recipient, margin, yPosition, 11);
  
  // Location on the right side with better alignment
  addText(receipt.location, pageWidth - margin - 60, yPosition, 10);
  yPosition += 25;
  
  // Start location and time with better formatting
  addText(`Start: ${receipt.startLocation}`, margin, yPosition, 10);
  yPosition += 8;
  addText(`${receipt.date} ${receipt.time}`, margin, yPosition, 9, 'normal', [128, 128, 128]);
  yPosition += 25;
  
  // Enhanced table setup
  const tableStartY = yPosition;
  const tableWidth = pageWidth - 2 * margin;
  const tableHeight = 45;
  const headerHeight = 14;
  const rowHeight = 31;
  
  // Table border with cleaner lines
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, tableStartY, tableWidth, tableHeight);
  
  // Header row background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, tableStartY, tableWidth, headerHeight, 'F');
  
  // Improved column positions for better spacing
  const col1X = margin + 8;
  const col2X = margin + 85;
  const col3X = margin + 125;
  const col4X = margin + 155;
  
  // Vertical lines with consistent spacing
  pdf.line(margin + 80, tableStartY, margin + 80, tableStartY + tableHeight);
  pdf.line(margin + 120, tableStartY, margin + 120, tableStartY + tableHeight);
  pdf.line(margin + 150, tableStartY, margin + 150, tableStartY + tableHeight);
  
  // Header text with better typography
  addText('Title', col1X, tableStartY + 9, 10, 'bold');
  addText('Sum (KES)', col2X, tableStartY + 9, 10, 'bold');
  addText('VAT 0%', col3X, tableStartY + 9, 10, 'bold');
  addText('Total sum (KES)', col4X, tableStartY + 9, 10, 'bold');
  
  // Horizontal line under header
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, tableStartY + headerHeight, pageWidth - margin, tableStartY + headerHeight);
  
  // Data row with better alignment
  const dataY = tableStartY + headerHeight + 12;
  addText('Trip Fee', col1X, dataY, 10);
  addText(receipt.tripFee.toFixed(2), col2X, dataY, 10);
  addText('0.00', col3X, dataY, 10);
  addText(receipt.tripFee.toFixed(2), col4X, dataY, 10);
  
  yPosition = tableStartY + tableHeight + 25;
  
  // Enhanced summary section (right aligned)
  const summaryX = pageWidth - margin - 70;
  const labelX = summaryX - 35;
  
  addText('Total (KES):', labelX, yPosition, 11);
  addText(receipt.tripFee.toFixed(2), summaryX, yPosition, 11);
  yPosition += 10;
  
  addText('VAT 0%:', labelX, yPosition, 11);
  addText('0.00', summaryX, yPosition, 11);
  yPosition += 10;
  
  // Total line with emphasis
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(labelX - 5, yPosition - 2, summaryX + 25, yPosition - 2);
  
  addText('Total including VAT (KES):', labelX, yPosition + 5, 12, 'bold');
  addText(receipt.total.toFixed(2), summaryX, yPosition + 5, 12, 'bold');
  yPosition += 25;
  
  // Enhanced payment information section
  addText(`Payment reference: KES${receipt.tripFee.toFixed(2)}`, margin, yPosition, 10);
  addText(`Amount: -${receipt.tripFee.toFixed(2)}`, margin + 80, yPosition, 10);
  yPosition += 20;
  
  // Payment method section with better styling
  addText('Payment Method:', margin, yPosition, 11, 'bold');
  yPosition += 12;
  
  // Payment status indicators
  addText('● Charged', margin, yPosition, 10, 'normal', [220, 38, 127]); // Pink for charged
  addText('○ Cash', margin + 60, yPosition, 10, 'normal', [34, 197, 94]); // Green for cash
  
  yPosition += 20;
  
  // Footer information
  pdf.setTextColor(128, 128, 128);
  addText('Thank you for choosing Bolt!', margin, yPosition, 9);
  addText('For support, visit bolt.eu/support', pageWidth - margin - 80, yPosition, 9);
  
  // Reset text color for any additional content
  pdf.setTextColor(0, 0, 0);
};