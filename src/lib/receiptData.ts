import { format } from 'date-fns';

interface TripData {
  date: string;
  time: string;
  destination: string;
  driverLocation: string;
}

type CurrencyCode = 'KES' | 'TZS';

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
  bookingFee: number;
  vat: number;
  total: number;
  paymentMethod: string;
  currency: CurrencyCode;
}

const PRICE_INCREMENT = 5;
const MAX_PRICE_GAP_KES = 300;
const TZS_BOOKING_FEE_RATE = 156.44 / 8000;

// Kenyan names for random generation
const kenyanNames = [
  'Jackson Kibe', 'Mary Wanjiku', 'David Otieno', 'Grace Muthoni', 'Peter Kamau',
  'Sarah Akinyi', 'John Ochieng', 'Faith Njeri', 'Michael Karanja', 'Agnes Wambui',
  'Samuel Kiprotich', 'Lucy Chebet', 'Daniel Mwangi', 'Rose Nyokabi', 'Kevin Omondi',
  'Elizabeth Wairimu', 'Joseph Kipchoge', 'Hannah Wanjiru', 'Francis Muturi', 'Catherine Adhiambo',
  'Charles Macharia', 'Jane Wangari', 'Robert Korir', 'Mercy Gathoni', 'Anthony Ndung\'u',
  'Esther Moraa', 'Patrick Gitau', 'Violet Kanini', 'George Kibaki', 'Helen Mwende'
];

const tanzanianMaleNames = [
  'Antony Masaki', 'Juma Mwinyi', 'Hassan Mussa', 'Said Juma', 'Omari Ally',
  'Bakari Hamisi', 'Yusuph Abdallah', 'Rajabu Salum', 'Kassim Mohamed', 'Mbaraka Selemani',
  'Abdulrahman Issa', 'Ramadhani Shabani', 'Athuman Rashid', 'Daudi John', 'Emmanuel Mushi',
  'Godfrey Massawe', 'Joseph Mrema', 'Michael Kessy', 'Daniel Shirima', 'Samwel Lema',
  'Peter Makoye', 'Charles Mwakalinga', 'Francis Nyerere', 'Moses Malima', 'Richard Minja',
  'Elibariki Sanga', 'Benedict Mapunda', 'Baraka Mtui', 'Erasto Mbise', 'Prosper Kimaro'
];

// Generate random invoice number in format: ########-KE####-### or ########-TZ####-###
const generateInvoiceNumber = (currency: CurrencyCode): string => {
  const firstPart = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const middlePart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const lastPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const countryCode = currency === 'TZS' ? 'TZ' : 'KE';
  return `${firstPart}-${countryCode}${middlePart}-${lastPart}`;
};

// Get random item from array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Split total price into amounts that stay very close together (small random variation),
// constrained to whole numbers in increments of 5.
const splitTotalPrice = (total: number, numberOfSplits: number): number[] => {
  if (numberOfSplits < 1) return [];
  if (!Number.isInteger(total) || total % PRICE_INCREMENT !== 0) {
    throw new Error(`Total must be a whole number in increments of ${PRICE_INCREMENT}`);
  }
  if (total < numberOfSplits * PRICE_INCREMENT) {
    throw new Error(`Total must be at least ${numberOfSplits * PRICE_INCREMENT}`);
  }

  if (numberOfSplits === 1) return [total];

  const totalUnits = total / PRICE_INCREMENT;
  const baseUnits = Math.floor(totalUnits / numberOfSplits);
  const splitUnits = Array.from({ length: numberOfSplits }, () => baseUnits);
  const remainderUnits = totalUnits - baseUnits * numberOfSplits;
  const maxGapUnits = MAX_PRICE_GAP_KES / PRICE_INCREMENT; // 0-300 KES spread window.

  // Distribute leftover units so differences stay minimal (max gap = 1 unit).
  const shuffledIndexes = Array.from({ length: numberOfSplits }, (_, index) => index);
  for (let i = shuffledIndexes.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffledIndexes[i], shuffledIndexes[randomIndex]] = [
      shuffledIndexes[randomIndex],
      shuffledIndexes[i],
    ];
  }
  for (let i = 0; i < remainderUnits; i++) {
    splitUnits[shuffledIndexes[i]] += 1;
  }

  const isWithinGap = (values: number[]) =>
    Math.max(...values) - Math.min(...values) <= maxGapUnits;

  const tryTransferOneUnit = (): boolean => {
    const donorIndexes = splitUnits
      .map((value, index) => (value > 1 ? index : -1))
      .filter((index) => index >= 0);
    if (donorIndexes.length === 0) {
      return false;
    }

    for (let attempt = 0; attempt < 40; attempt++) {
      const donorIndex = donorIndexes[Math.floor(Math.random() * donorIndexes.length)];
      const receiverIndex = Math.floor(Math.random() * numberOfSplits);
      if (receiverIndex === donorIndex) {
        continue;
      }

      const candidate = [...splitUnits];
      candidate[donorIndex] -= 1;
      candidate[receiverIndex] += 1;

      if (isWithinGap(candidate)) {
        splitUnits[donorIndex] -= 1;
        splitUnits[receiverIndex] += 1;
        return true;
      }
    }
    return false;
  };

  // Add slight randomness while keeping prices very close.
  const desiredTransfers = Math.max(1, Math.floor(numberOfSplits / 2));
  let completedTransfers = 0;
  for (let i = 0; i < desiredTransfers; i++) {
    if (tryTransferOneUnit()) {
      completedTransfers += 1;
    }
  }

  // If still identical, force one tiny variation when feasible.
  const areAllEqual = splitUnits.every((value) => value === splitUnits[0]);
  if (areAllEqual) {
    tryTransferOneUnit();
  }

  return splitUnits.map((units) => units * PRICE_INCREMENT);
};

export const generateReceiptData = (
  numberOfTrips: number,
  totalPrice: number,
  trips: TripData[],
  recipientName: string,
  currency: CurrencyCode = 'KES',
): ReceiptData[] => {
  const receiptTotals = splitTotalPrice(totalPrice, numberOfTrips);
  
  return trips.map((trip, index) => {
    const tripDate = new Date(trip.date);
    const [hours, minutes] = trip.time.split(':');
    tripDate.setHours(parseInt(hours), parseInt(minutes));
    
    const recipient = recipientName.trim();
    const driverNames = currency === 'TZS' ? tanzanianMaleNames : kenyanNames;
    const driverName = getRandomItem(driverNames.filter(name => name !== recipient));
    const startLocation = trip.destination.trim();
    const driverLocation = trip.driverLocation.trim();
    const total = receiptTotals[index];
    const bookingFee = currency === 'TZS' ? Number((total * TZS_BOOKING_FEE_RATE).toFixed(2)) : 0;
    const tripFee = Number((total - bookingFee).toFixed(2));
    
    return {
      invoiceNumber: generateInvoiceNumber(currency),
      date: format(tripDate, 'yyyy-MM-dd'),
      time: format(tripDate, 'HH:mm'),
      recipient,
      driverName,
      driverCity: driverLocation,
      location: driverLocation,
      startLocation,
      tripFee,
      bookingFee,
      vat: 0, // Always 0% as specified
      total,
      paymentMethod: 'Cash',
      currency
    };
  });
};
