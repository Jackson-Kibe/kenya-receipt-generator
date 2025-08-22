import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generatePDF } from '@/lib/pdfGenerator';
import { generateReceiptData } from '@/lib/receiptData';

interface TripData {
  date: string;
  time: string;
  destination: string;
}

const ReceiptGenerator = () => {
  const [numberOfTrips, setNumberOfTrips] = useState(1);
  const [totalPrice, setTotalPrice] = useState('');
  const [trips, setTrips] = useState<TripData[]>([{ date: '', time: '', destination: '' }]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleTripsChange = (value: number) => {
    setNumberOfTrips(value);
    const newTrips = Array.from({ length: value }, (_, i) => 
      trips[i] || { date: '', time: '', destination: '' }
    );
    setTrips(newTrips);
  };

  const updateTrip = (index: number, field: keyof TripData, value: string) => {
    const newTrips = [...trips];
    newTrips[index] = { ...newTrips[index], [field]: value };
    setTrips(newTrips);
  };

  const addTrip = () => {
    setNumberOfTrips(prev => prev + 1);
    setTrips(prev => [...prev, { date: '', time: '', destination: '' }]);
  };

  const removeTrip = (index: number) => {
    if (trips.length > 1) {
      setNumberOfTrips(prev => prev - 1);
      setTrips(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleGenerate = async () => {
    if (!totalPrice || trips.some(trip => !trip.date || !trip.time || !trip.destination)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before generating receipts.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const receiptData = generateReceiptData(
        numberOfTrips,
        parseFloat(totalPrice),
        trips
      );
      
      await generatePDF(receiptData);
      
      toast({
        title: "Success!",
        description: `Generated ${numberOfTrips} receipt(s) successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate receipts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bolt-green-light to-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bolt-green to-bolt-green-dark flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-bolt-green to-bolt-green-dark bg-clip-text text-transparent">
              Bolt Receipt Generator
            </h1>
          </div>
          <p className="text-bolt-text-muted text-lg">
            Generate professional mock PDF receipts for educational purposes
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-bolt-green to-bolt-green-dark text-white rounded-t-lg">
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Receipt Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="trips" className="text-sm font-medium text-bolt-text">
                  Number of Trips
                </Label>
                <Input
                  id="trips"
                  type="number"
                  min="1"
                  max="20"
                  value={numberOfTrips}
                  onChange={(e) => handleTripsChange(parseInt(e.target.value) || 1)}
                  className="border-bolt-green/20 focus:border-bolt-green focus:ring-bolt-green"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="total" className="text-sm font-medium text-bolt-text">
                  Total Price (KES)
                </Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 930.00"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  className="border-bolt-green/20 focus:border-bolt-green focus:ring-bolt-green"
                />
              </div>
            </div>

            <Separator className="bg-bolt-green/20" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-bolt-text">Trip Details</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTrip}
                  className="border-bolt-green text-bolt-green hover:bg-bolt-green hover:text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Trip
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {trips.map((trip, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-bolt-green/10">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-bolt-text-muted">
                          Date for Trip {index + 1}
                        </Label>
                        <Input
                          type="date"
                          value={trip.date}
                          onChange={(e) => updateTrip(index, 'date', e.target.value)}
                          className="text-sm border-bolt-green/20 focus:border-bolt-green focus:ring-bolt-green"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-bolt-text-muted">
                          Time for Trip {index + 1}
                        </Label>
                        <Input
                          type="time"
                          value={trip.time}
                          onChange={(e) => updateTrip(index, 'time', e.target.value)}
                          className="text-sm border-bolt-green/20 focus:border-bolt-green focus:ring-bolt-green"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-bolt-text-muted">
                          Destination for Trip {index + 1}
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g., Westlands, Nairobi"
                          value={trip.destination}
                          onChange={(e) => updateTrip(index, 'destination', e.target.value)}
                          className="text-sm border-bolt-green/20 focus:border-bolt-green focus:ring-bolt-green"
                        />
                      </div>
                    </div>
                    {trips.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTrip(index)}
                        className="border-destructive text-destructive hover:bg-destructive hover:text-white flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-bolt-green/20" />

            <div className="flex justify-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-gradient-to-r from-bolt-green to-bolt-green-dark hover:from-bolt-green-dark hover:to-bolt-green text-white font-semibold px-8 py-3 text-lg shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Generate & Download Receipts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReceiptGenerator;