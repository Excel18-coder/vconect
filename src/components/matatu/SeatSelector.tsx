import { Button } from '@/components/ui/button';
import { Armchair } from 'lucide-react';
import { useState } from 'react';

interface Seat {
  number: number;
  is_booked: boolean;
}

interface SeatSelectorProps {
  scheduleId: string;
  totalSeats?: number;
  bookedSeats?: number[];
  onSelectSeats: (seats: number[]) => void;
  maxSeats?: number;
}

export default function SeatSelector({
  scheduleId,
  totalSeats = 48,
  bookedSeats = [],
  onSelectSeats,
  maxSeats = 5,
}: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const handleSeatClick = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) return; // Can't select booked seats

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length < maxSeats) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedSeats.length > 0) {
      onSelectSeats(selectedSeats.sort((a, b) => a - b));
    }
  };

  // Create seat grid (typically 2 columns for matatus)
  const columns = 2;
  const rows = Math.ceil(totalSeats / columns);
  const seats: Seat[] = Array.from({ length: totalSeats }, (_, i) => ({
    number: i + 1,
    is_booked: bookedSeats.includes(i + 1),
  }));

  return (
    <div className="space-y-6">
      {/* Seat Grid */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-center mb-4">
          <div className="text-sm text-muted-foreground mb-2">
            Driver • Windshield
          </div>
          <div className="h-8 bg-muted rounded-t-lg w-40"></div>
        </div>

        {/* Seat Layout */}
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {seats.map((seat) => (
            <button
              key={seat.number}
              onClick={() => handleSeatClick(seat.number)}
              disabled={seat.is_booked}
              className={`relative group ${
                seat.is_booked
                  ? 'cursor-not-allowed opacity-50'
                  : selectedSeats.includes(seat.number)
                    ? 'text-primary'
                    : ''
              }`}
              title={
                seat.is_booked
                  ? 'Booked'
                  : selectedSeats.includes(seat.number)
                    ? 'Selected'
                    : 'Available'
              }
            >
              <div
                className={`p-3 rounded-lg border-2 transition-all ${
                  seat.is_booked
                    ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                    : selectedSeats.includes(seat.number)
                      ? 'border-primary bg-primary/10'
                      : 'border-green-300 bg-green-50 hover:border-primary hover:bg-primary/5'
                }`}
              >
                <Armchair className="h-6 w-6 mx-auto" />
                <div className="text-xs font-semibold mt-1">{seat.number}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mb-4">
          <div className="h-8 bg-muted rounded-b-lg w-40"></div>
          <div className="text-sm text-muted-foreground mt-2">
            Back • Luggage area
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-green-300 rounded-lg bg-green-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary rounded-lg bg-primary/10" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 border-2 border-gray-300 rounded-lg bg-gray-100 opacity-50" />
          <span>Booked</span>
        </div>
      </div>

      {/* Selection Info */}
      {selectedSeats.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium">
            Selected {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}: <br />
            <span className="text-primary font-semibold">{selectedSeats.join(', ')}</span>
          </p>
        </div>
      )}

      {/* Confirm Button */}
      <Button
        onClick={handleConfirm}
        disabled={selectedSeats.length === 0}
        className="w-full bg-gradient-to-r from-primary to-pink-500"
        size="lg"
      >
        Confirm Selection ({selectedSeats.length}/{maxSeats})
      </Button>
    </div>
  );
}
