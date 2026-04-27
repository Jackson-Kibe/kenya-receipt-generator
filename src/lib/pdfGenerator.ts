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

type ReceiptTextAlign = 'left' | 'center' | 'right';
type ReceiptFontStyle = 'normal' | 'bold';

interface ReceiptTextOptions {
  text: string;
  x: number;
  y: number;
  size?: number;
  style?: ReceiptFontStyle;
  align?: ReceiptTextAlign;
}

const BOLT_LOGO_URL = '/receipt-assets/bolt-logo.png';
const PAYMENT_ICON_URL = '/receipt-assets/cash-icon.png';

const CALIBRI_REGULAR_URL = '/fonts/calibri.ttf';
const CALIBRI_BOLD_URL = '/fonts/calibrib.ttf';
const CALIBRI_REGULAR_FILE = 'calibri.ttf';
const CALIBRI_BOLD_FILE = 'calibrib.ttf';
const CALIBRI_FONT_NAME = 'calibri';

let calibriFontDataPromise: Promise<{ regular: string; bold: string }> | null = null;
const imageDataUrlCache = new Map<string, Promise<string>>();
const imageWhiteBgCache = new Map<string, Promise<string>>();

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
};

const loadFontAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load font from ${url}`);
  }

  return arrayBufferToBase64(await response.arrayBuffer());
};

const loadCalibriFontData = (): Promise<{ regular: string; bold: string }> => {
  if (!calibriFontDataPromise) {
    calibriFontDataPromise = Promise.all([
      loadFontAsBase64(CALIBRI_REGULAR_URL),
      loadFontAsBase64(CALIBRI_BOLD_URL),
    ]).then(([regular, bold]) => ({ regular, bold }));
  }

  return calibriFontDataPromise;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image blob.'));
    reader.readAsDataURL(blob);
  });

const loadImageAsDataUrl = (url: string): Promise<string> => {
  const cached = imageDataUrlCache.get(url);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load image from ${url}`);
    }

    return blobToDataUrl(await response.blob());
  })();

  imageDataUrlCache.set(url, promise);
  return promise;
};

const replaceBlackPixelsWithWhite = (imageDataUrl: string): Promise<string> => {
  const cached = imageWhiteBgCache.get(imageDataUrl);
  if (cached) {
    return cached;
  }

  const promise = new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;

      const context = canvas.getContext('2d');
      if (!context) {
        resolve(imageDataUrl);
        return;
      }

      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];

        if (alpha > 0 && red <= 24 && green <= 24 && blue <= 24) {
          data[index] = 255;
          data[index + 1] = 255;
          data[index + 2] = 255;
        }
      }

      context.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    image.onerror = () => resolve(imageDataUrl);
    image.src = imageDataUrl;
  });

  imageWhiteBgCache.set(imageDataUrl, promise);
  return promise;
};

export const generatePDF = async (receipts: ReceiptData[]): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  let documentFont = 'helvetica';
  try {
    const calibriFontData = await loadCalibriFontData();
    pdf.addFileToVFS(CALIBRI_REGULAR_FILE, calibriFontData.regular);
    pdf.addFileToVFS(CALIBRI_BOLD_FILE, calibriFontData.bold);
    pdf.addFont(CALIBRI_REGULAR_FILE, CALIBRI_FONT_NAME, 'normal');
    pdf.addFont(CALIBRI_BOLD_FILE, CALIBRI_FONT_NAME, 'bold');
    documentFont = CALIBRI_FONT_NAME;
  } catch (fontError) {
    console.error('Failed to load Calibri fonts. Falling back to Helvetica.', fontError);
  }

  let boltLogoImage: string | null = null;
  let paymentIconImage: string | null = null;
  try {
    const [rawBoltLogoImage, rawPaymentIconImage] = await Promise.all([
      loadImageAsDataUrl(BOLT_LOGO_URL),
      loadImageAsDataUrl(PAYMENT_ICON_URL),
    ]);

    [boltLogoImage, paymentIconImage] = await Promise.all([
      replaceBlackPixelsWithWhite(rawBoltLogoImage),
      replaceBlackPixelsWithWhite(rawPaymentIconImage),
    ]);
  } catch (imageError) {
    console.error('Failed to load receipt images. Continuing without logos.', imageError);
  }

  for (let i = 0; i < receipts.length; i++) {
    if (i > 0) {
      pdf.addPage();
    }

    generateReceiptPage(pdf, receipts[i], boltLogoImage, paymentIconImage, documentFont);
  }

  const fileName = `bolt-receipts-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

const generateReceiptPage = (
  pdf: jsPDF,
  receipt: ReceiptData,
  boltLogoImage: string | null,
  paymentIconImage: string | null,
  documentFont: string,
): void => {
  const drawText = ({
    text,
    x,
    y,
    size = 10.5,
    style = 'normal',
    align = 'left',
  }: ReceiptTextOptions) => {
    pdf.setFont(documentFont, style);
    pdf.setFontSize(size);

    const options =
      align === 'left'
        ? ({ baseline: 'top' } as const)
        : ({ baseline: 'top', align } as const);
    pdf.text(text, x, y, options);
  };

  const tripFee = receipt.tripFee.toFixed(2);
  const total = receipt.total.toFixed(2);

  pdf.setTextColor(0, 0, 0);

  if (boltLogoImage) {
    pdf.addImage(boltLogoImage, 'PNG', 39.75, 35.25, 112.5, 65.25);
  }

  drawText({
    text: `Invoice no. ${receipt.invoiceNumber}`,
    x: 572.25,
    y: 52.32,
    size: 13.5,
    style: 'bold',
    align: 'right',
  });

  drawText({
    text: `Date: ${receipt.date}`,
    x: 572.25,
    y: 90.78,
    align: 'right',
  });

  drawText({ text: 'Recipient:', x: 39.75, y: 129.03 });
  drawText({ text: receipt.recipient, x: 39.75, y: 146.28, style: 'bold' });
  drawText({
    text: receipt.driverName,
    x: 572.25,
    y: 146.28,
    style: 'bold',
    align: 'right',
  });
  drawText({
    text: receipt.driverCity,
    x: 572.25,
    y: 163.53,
    align: 'right',
  });

  drawText({
    text: `Start: ${receipt.startLocation} (${receipt.date} ${receipt.time})`,
    x: 39.75,
    y: 206.28,
  });

  const tableLeft = 34.125;
  const tableTop = 247.875;
  const tableWidth = 543.75;
  const tableHeight = 42;
  const headerSplitY = 268.875;
  const colOneSplitX = 306.375;
  const colTwoSplitX = 387.375;
  const colThreeSplitX = 468.375;

  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.75);
  pdf.rect(tableLeft, tableTop, tableWidth, tableHeight);
  pdf.line(tableLeft, headerSplitY, tableLeft + tableWidth, headerSplitY);
  pdf.line(colOneSplitX, tableTop, colOneSplitX, tableTop + tableHeight);
  pdf.line(colTwoSplitX, tableTop, colTwoSplitX, tableTop + tableHeight);
  pdf.line(colThreeSplitX, tableTop, colThreeSplitX, tableTop + tableHeight);

  drawText({ text: 'Title', x: 170.06, y: 251.28, style: 'bold', align: 'center' });
  drawText({ text: 'Sum (KES)', x: 346.78, y: 251.28, style: 'bold', align: 'center' });
  drawText({ text: 'VAT 0%', x: 428.35, y: 251.28, style: 'bold', align: 'center' });
  drawText({
    text: 'Total sum (KES)',
    x: 523.5,
    y: 251.28,
    style: 'bold',
    align: 'center',
  });

  drawText({ text: 'Trip Fee', x: 40.5, y: 272.28 });
  drawText({ text: tripFee, x: 381.18, y: 272.28, align: 'right' });
  drawText({ text: '0.00', x: 462.75, y: 272.28, align: 'right' });
  drawText({ text: tripFee, x: 571.49, y: 272.28, style: 'bold', align: 'right' });

  drawText({ text: 'Total (KES):', x: 416.45, y: 317.28 });
  drawText({ text: tripFee, x: 572.25, y: 317.28, align: 'right' });
  drawText({ text: 'VAT 0%:', x: 432.28, y: 334.53 });
  drawText({ text: '0.00', x: 572.25, y: 334.53, align: 'right' });

  drawText({
    text: 'Total including VAT (KES):',
    x: 339.38,
    y: 351.78,
    style: 'bold',
  });
  drawText({ text: total, x: 572.25, y: 351.78, style: 'bold', align: 'right' });

  drawText({ text: 'Charged', x: 364.58, y: 394.06, style: 'bold' });
  if (paymentIconImage) {
    pdf.addImage(paymentIconImage, 'PNG', 414, 386.25, 22.5, 21.75);
  }
  drawText({ text: 'Cash:', x: 442.1, y: 394.06, style: 'bold' });
  drawText({ text: total, x: 572.25, y: 390.03, style: 'bold', align: 'right' });
};
