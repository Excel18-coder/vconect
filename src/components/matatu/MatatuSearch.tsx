import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useState } from 'react';

interface MatatuSearchProps {
  onSearch: (criteria: {
    from: string;
    to: string;
    date: string;
    passengers: number;
  }) => void;
  isLoading?: boolean;
}

export default function MatatuSearch({ onSearch, isLoading = false }: MatatuSearchProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const handleSearch = () => {
    if (from && to && date) {
      onSearch({ from: from.trim(), to: to.trim(), date, passengers });
    }
  };

  const popularRoutes = [
    { from: 'Nairobi', to: 'Mombasa' },
    { from: 'Nairobi', to: 'Kisumu' },
    { from: 'Nairobi', to: 'Nakuru' },
    { from: 'Mombasa', to: 'Nairobi' },
    { from: 'Kisumu', to: 'Nairobi' },
    { from: 'Nakuru', to: 'Nairobi' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div>
          <label className="mb-2 block text-sm font-medium">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Departure city"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Arrival city"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-lg border px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Passengers</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-end">
          <Button onClick={handleSearch} disabled={!from || !to || !date || isLoading} className="w-full">
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      <div className="border-t pt-6">
        <p className="mb-3 text-sm font-medium text-muted-foreground">Popular Routes</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {popularRoutes.map((route, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFrom(route.from);
                setTo(route.to);
              }}
              className="rounded-lg border p-2 text-sm transition-colors hover:border-primary hover:bg-primary/10"
            >
              <div className="font-medium">{route.from}</div>
              <div className="text-xs text-muted-foreground">→ {route.to}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
