import { Button } from '@/components/ui/button';
import { Armchair } from 'lucide-react';
import { useState } from 'react';

interface SeatSelectorProps {
  scheduleId: string;
  totalSeats?: number;
  bookedSeats?: number[];
  onSelectSeats: (seats: number[]) => void;
  maxSeats?: number;
}

export default function SeatSelector({ totalSeats = 48, bookedSeats = [], onSelectSeats, maxSeats = 5 }: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const handleSeatClick = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) return;

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((seat) => seat !== seatNumber));
      return;
    }

    if (selectedSeats.length < maxSeats) {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleConfirm = () => {
    if (selectedSeats.length > 0) {
      onSelectSeats(selectedSeats.sort((a, b) => a - b));
    }
  };

  const seats = Array.from({ length: totalSeats }, (_, index) => index + 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <div className="mb-2 text-sm text-muted-foreground">Driver • Windshield</div>
          <div className="h-8 w-40 rounded-t-lg bg-muted" />
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {seats.map((seatNumber) => {
            const booked = bookedSeats.includes(seatNumber);
            const selected = selectedSeats.includes(seatNumber);

            return (
              <button
                key={seatNumber}
                onClick={() => handleSeatClick(seatNumber)}
                disabled={booked}
                className={`rounded-lg border-2 p-3 transition-all ${booked
                  ? 'cursor-not-allowed border-gray-300 bg-gray-100 opacity-50'
                  : selected
                    ? 'border-primary bg-primary/10'
                    : 'border-green-300 bg-green-50 hover:border-primary hover:bg-primary/5'
                  }`}
                title={booked ? 'Booked' : selected ? 'Selected' : 'Available'}
              >
                <Armchair className="mx-auto h-6 w-6" />
                <div className="mt-1 text-xs font-semibold">{seatNumber}</div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <div className="h-8 w-40 rounded-b-lg bg-muted" />
          <div className="mt-2 text-sm text-muted-foreground">Back • Luggage area</div>
        </div>
      </div>

      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg border-2 border-green-300 bg-green-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg border-2 border-primary bg-primary/10" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg border-2 border-gray-300 bg-gray-100 opacity-50" />
          <span>Booked</span>
        </div>
      </div>

      {selectedSeats.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium">
            Selected {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}: <span className="font-semibold text-primary">{selectedSeats.join(', ')}</span>
          </p>
        </div>
      )}

      <Button onClick={handleConfirm} disabled={selectedSeats.length === 0} className="w-full" size="lg">
        Confirm Selection ({selectedSeats.length}/{maxSeats})
      </Button>
    </div>
  );
}
