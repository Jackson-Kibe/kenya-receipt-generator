import { format } from 'date-fns';

interface TripData {
  date: string;
  time: string;
  destination: string;
}

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

// Kenyan names for random generation
const kenyanNames = [
  'Jackson Kibe', 'Mary Wanjiku', 'David Otieno', 'Grace Muthoni', 'Peter Kamau',
  'Sarah Akinyi', 'John Ochieng', 'Faith Njeri', 'Michael Karanja', 'Agnes Wambui',
  'Samuel Kiprotich', 'Lucy Chebet', 'Daniel Mwangi', 'Rose Nyokabi', 'Kevin Omondi',
  'Elizabeth Wairimu', 'Joseph Kipchoge', 'Hannah Wanjiru', 'Francis Muturi', 'Catherine Adhiambo',
  'Charles Macharia', 'Jane Wangari', 'Robert Korir', 'Mercy Gathoni', 'Anthony Ndung\'u',
  'Esther Moraa', 'Patrick Gitau', 'Violet Kanini', 'George Kibaki', 'Helen Mwende'
];

// Nairobi locations
const nairobiLocations = [
  'Westlands', 'Karen', 'Kilimani', 'Lavington', 'Parklands', 'South B', 'South C',
  'Embakasi', 'Kasarani', 'Kileleshwa', 'Langata', 'Donholm', 'Buruburu', 'Umoja',
  'Kahawa', 'Githurai', 'Rongai', 'Kitengela', 'Ruaka', 'Juja', 'Thika Road',
  'Mombasa Road', 'Ngong Road', 'Waiyaki Way', 'Limuru Road'
];

// Generate random invoice number in format: ########-KE####-###
const generateInvoiceNumber = (): string => {
  const firstPart = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  const middlePart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const lastPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${firstPart}-KE${middlePart}-${lastPart}`;
};

// Get random item from array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Split total price into random amounts that sum exactly to the total
const splitTotalPrice = (total: number, numberOfSplits: number): number[] => {
  if (numberOfSplits === 1) return [total];
  
  const splits: number[] = [];
  let remaining = total;
  
  for (let i = 0; i < numberOfSplits - 1; i++) {
    // Generate a random split between 10% and 90% of remaining amount
    const minSplit = Math.max(1, remaining * 0.1);
    const maxSplit = Math.min(remaining - (numberOfSplits - i - 1), remaining * 0.9);
    const split = Math.random() * (maxSplit - minSplit) + minSplit;
    const roundedSplit = Math.round(split * 100) / 100; // Round to 2 decimal places
    
    splits.push(roundedSplit);
    remaining -= roundedSplit;
  }
  
  // Add the remaining amount as the last split
  splits.push(Math.round(remaining * 100) / 100);
  
  return splits;
};

export const generateReceiptData = (
  numberOfTrips: number,
  totalPrice: number,
  trips: TripData[]
): ReceiptData[] => {
  const tripFees = splitTotalPrice(totalPrice, numberOfTrips);
  
  return trips.map((trip, index) => {
    const tripDate = new Date(trip.date);
    const [hours, minutes] = trip.time.split(':');
    tripDate.setHours(parseInt(hours), parseInt(minutes));
    
    const recipient = getRandomItem(kenyanNames);
    const driverName = getRandomItem(kenyanNames.filter(name => name !== recipient));
    const location = trip.destination || getRandomItem(nairobiLocations);
    const startLocation = getRandomItem(nairobiLocations.filter(loc => loc !== location));
    const city = location.includes(',')
      ? (location.split(',').pop() || 'Nairobi').trim()
      : 'Nairobi';
    
    return {
      invoiceNumber: generateInvoiceNumber(),
      date: format(tripDate, 'yyyy-MM-dd'),
      time: format(tripDate, 'HH:mm'),
      recipient,
      driverName,
      driverCity: city,
      location: location.includes('Nairobi') ? location : `${location}, Nairobi`,
      startLocation: `${startLocation}, Nairobi`,
      tripFee: tripFees[index],
      vat: 0, // Always 0% as specified
      total: tripFees[index],
      paymentMethod: 'Cash'
    };
  });
};
