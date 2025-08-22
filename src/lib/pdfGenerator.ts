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
  
  // Helper function to add centered text
  const addCenteredText = (text: string, y: number, fontSize: number = 12, fontStyle: string = 'normal') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    const textWidth = pdf.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    pdf.text(text, x, y);
  };
  
  // Helper function to add left-aligned text
  const addText = (text: string, x: number, y: number, fontSize: number = 10, fontStyle: string = 'normal') => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.text(text, x, y);
  };
  
  // Header - Bolt Logo (simulated with text)
  pdf.setFillColor(52, 168, 83); // Bolt green color
  pdf.rect(margin, yPosition - 10, pageWidth - 2 * margin, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  addCenteredText('Bolt', yPosition + 5, 24, 'bold');
  yPosition += 35;
  
  // Reset text color to black
  pdf.setTextColor(0, 0, 0);
  
  // Invoice header
  addText(`Invoice no. ${receipt.invoiceNumber}`, pageWidth - margin - 80, yPosition, 10, 'bold');
  yPosition += 10;
  addText(`Date: ${receipt.date}`, pageWidth - margin - 80, yPosition, 9);
  yPosition += 20;
  
  // Recipient information
  addText('Recipient:', margin, yPosition, 10, 'bold');
  yPosition += 8;
  addText(receipt.recipient, margin, yPosition, 10);
  yPosition += 15;
  
  addText(`${receipt.location}`, pageWidth - margin - 60, yPosition - 7, 9);
  yPosition += 10;
  
  // Trip details
  addText(`Start: ${receipt.startLocation} (${receipt.date} ${receipt.time})`, margin, yPosition, 9);
  yPosition += 25;
  
  // Table header
  const tableStartY = yPosition;
  const tableHeight = 40;
  
  // Draw table borders
  pdf.setLineWidth(0.5);
  pdf.rect(margin, tableStartY, pageWidth - 2 * margin, tableHeight);
  
  // Table header row
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, tableStartY, pageWidth - 2 * margin, 12, 'F');
  
  const col1X = margin + 5;
  const col2X = margin + 80;
  const col3X = margin + 120;
  const col4X = margin + 150;
  
  // Header row
  addText('Title', col1X, tableStartY + 8, 9, 'bold');
  addText('Sum (KES)', col2X, tableStartY + 8, 9, 'bold');
  addText('VAT 0%', col3X, tableStartY + 8, 9, 'bold');
  addText('Total sum (KES)', col4X, tableStartY + 8, 9, 'bold');
  
  // Horizontal line under header
  pdf.line(margin, tableStartY + 12, pageWidth - margin, tableStartY + 12);
  
  // Data row
  addText('Trip Fee', col1X, tableStartY + 22, 9);
  addText(receipt.tripFee.toFixed(2), col2X, tableStartY + 22, 9);
  addText('0.00', col3X, tableStartY + 22, 9);
  addText(receipt.tripFee.toFixed(2), col4X, tableStartY + 22, 9);
  
  yPosition = tableStartY + tableHeight + 15;
  
  // Summary
  const summaryX = pageWidth - margin - 80;
  addText(`Total (KES): ${receipt.tripFee.toFixed(2)}`, summaryX, yPosition, 10);
  yPosition += 10;
  addText(`VAT 0%: 0.00`, summaryX, yPosition, 10);
  yPosition += 10;
  addText(`Total including VAT (KES): ${receipt.total.toFixed(2)}`, summaryX, yPosition, 10, 'bold');
  yPosition += 20;
  
  // Payment information
  addText(`Paid by KES${receipt.tripFee.toFixed(2)}KES7569: -${receipt.tripFee.toFixed(2)}`, margin, yPosition, 9);
  yPosition += 10;
  
  // Payment method with icons (simulated)
  addText('Charged', margin, yPosition, 9, 'bold');
  addText('Cash', margin + 60, yPosition, 9, 'bold');
  
  // Add some payment method indicators (simplified representation)
  pdf.setFillColor(200, 200, 200);
  pdf.rect(margin + 90, yPosition - 5, 15, 8, 'F');
  pdf.rect(margin + 110, yPosition - 5, 15, 8, 'F');
  addText('💳', margin + 92, yPosition, 8);
  addText('💰', margin + 112, yPosition, 8);
  
  yPosition += 30;
  
  // Footer
  addCenteredText('Thank you for choosing Bolt!', yPosition, 9);
  addCenteredText('This is a mock receipt for educational purposes only.', yPosition + 10, 8);
};