import jsPDF from 'jspdf';

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
  const margin = 18;
  let yPosition = 24;

  const addText = (
    text: string,
    x: number,
    y: number,
    fontSize: number = 10,
    fontStyle: 'normal' | 'bold' = 'normal',
    align: 'left' | 'center' | 'right' = 'left',
    color: [number, number, number] = [0, 0, 0],
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(color[0], color[1], color[2]);

    const options = align !== 'left' ? ({ align } as const) : undefined;
    if (options) {
      pdf.text(text, x, y, options);
    } else {
      pdf.text(text, x, y);
    }
  };

  const drawPaymentBadge = (x: number, y: number) => {
    pdf.setFillColor(9, 168, 85);
    pdf.roundedRect(x, y - 5.5, 16, 11, 2, 2, 'F');
    pdf.setFillColor(255, 255, 255);
    pdf.circle(x + 5, y, 2.2, 'F');
    pdf.setFillColor(220, 53, 69);
    pdf.rect(x + 10, y - 3, 5, 6, 'F');
  };

  // Invoice number centered, date on the right
  addText(`Invoice no. ${receipt.invoiceNumber}`, pageWidth / 2, yPosition, 11, 'bold', 'center');
  addText(`Date: ${receipt.date}`, pageWidth - margin, yPosition + 8, 9, 'normal', 'right');

  yPosition += 26;

  // Recipient on left, driver on right
  addText('Recipient:', margin, yPosition, 9, 'normal', 'left', [95, 95, 95]);
  addText(receipt.recipient, margin, yPosition + 6, 10, 'bold');
  addText(receipt.driverName, pageWidth - margin, yPosition, 9, 'bold', 'right');
  addText(receipt.driverCity, pageWidth - margin, yPosition + 8, 9, 'normal', 'right', [160, 0, 0]);

  yPosition += 28;

  // Start and time line
  addText(
    `Start: ${receipt.startLocation} (${receipt.date} ${receipt.time})`,
    margin,
    yPosition,
    9,
    'normal',
    'left',
    [70, 70, 70],
  );

  yPosition += 16;

  // Table section
  const tableWidth = pageWidth - margin * 2;
  const headerHeight = 10;
  const rowHeight = 12;
  const tableHeight = headerHeight + rowHeight;
  const tableStartY = yPosition;

  const columnWidths = [
    tableWidth * 0.46,
    tableWidth * 0.18,
    tableWidth * 0.14,
    tableWidth * 0.22,
  ];
  const colX: number[] = [
    margin,
    margin + columnWidths[0],
    margin + columnWidths[0] + columnWidths[1],
    margin + columnWidths[0] + columnWidths[1] + columnWidths[2],
    margin + tableWidth,
  ];

  pdf.setDrawColor(60, 60, 60);
  pdf.setLineWidth(0.35);
  pdf.rect(margin, tableStartY, tableWidth, tableHeight);

  pdf.setFillColor(247, 247, 247);
  pdf.rect(margin, tableStartY, tableWidth, headerHeight, 'F');
  pdf.line(margin, tableStartY + headerHeight, margin + tableWidth, tableStartY + headerHeight);

  colX.slice(1, -1).forEach((x) => {
    pdf.line(x, tableStartY, x, tableStartY + tableHeight);
  });

  const headerY = tableStartY + 7.5;
  addText('Title', colX[0] + columnWidths[0] / 2, headerY, 9, 'bold', 'center');
  addText('Sum (KES)', colX[1] + columnWidths[1] / 2, headerY, 9, 'bold', 'center');
  addText('VAT 0%', colX[2] + columnWidths[2] / 2, headerY, 9, 'bold', 'center');
  addText('Total sum (KES)', colX[3] + columnWidths[3] / 2, headerY, 9, 'bold', 'center');

  const dataY = tableStartY + headerHeight + 8.5;
  addText('Trip Fee', colX[0] + 4, dataY, 9);
  addText(receipt.tripFee.toFixed(2), colX[1] + columnWidths[1] - 4, dataY, 9, 'normal', 'right');
  addText('0.00', colX[2] + columnWidths[2] - 4, dataY, 9, 'normal', 'right');
  addText(receipt.tripFee.toFixed(2), colX[3] + columnWidths[3] - 4, dataY, 9, 'bold', 'right');

  yPosition = tableStartY + tableHeight + 18;

  // Totals on the right
  const summaryRight = pageWidth - margin;
  const summaryLabel = summaryRight - 55;

  addText('Total (KES):', summaryLabel, yPosition, 9);
  addText(receipt.tripFee.toFixed(2), summaryRight, yPosition, 9, 'normal', 'right');
  yPosition += 9;

  addText('VAT 0%:', summaryLabel, yPosition, 9);
  addText('0.00', summaryRight, yPosition, 9, 'normal', 'right');
  yPosition += 8;

  pdf.line(summaryLabel - 6, yPosition + 1.5, summaryRight, yPosition + 1.5);
  addText('Total including VAT (KES):', summaryLabel, yPosition + 8, 10, 'bold');
  addText(receipt.total.toFixed(2), summaryRight, yPosition + 8, 10, 'bold', 'right');

  yPosition += 24;
  addText(receipt.total.toFixed(2), summaryRight, yPosition, 11, 'bold', 'right');

  yPosition += 10;

  // Payment line
  addText('Charged', margin, yPosition, 9);
  drawPaymentBadge(margin + 32, yPosition);
  addText('Cash:', margin + 52, yPosition, 9);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.35);
  pdf.line(margin + 70, yPosition - 2, margin + 120, yPosition - 2);
};
