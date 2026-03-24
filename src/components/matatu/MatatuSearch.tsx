import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useState } from 'react';

interface MatafuSearchProps {
  onSearch: (criteria: {
    from: string;
    to: string;
    date: string;
    passengers: number;
  }) => void;
  isLoading?: boolean;
}

export default function MatafuSearch({ onSearch, isLoading = false }: MatafuSearchProps) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const handleSearch = () => {
    if (from && to && date) {
      onSearch({
        from: from.trim(),
        to: to.trim(),
        date,
        passengers,
      });
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* From */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Departure city"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* To */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Arrival city"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Date */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="relative">
          <label className="block text-sm font-medium mb-2">Passengers</label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <Button
            onClick={handleSearch}
            disabled={!from || !to || !date || isLoading}
            className="w-full bg-gradient-to-r from-primary to-pink-500 hover:shadow-glow"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-sm font-medium mb-3 text-muted-foreground">Popular Routes</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {popularRoutes.map((route, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFrom(route.from);
                setTo(route.to);
              }}
              className="p-2 text-sm border rounded-lg hover:bg-primary/10 hover:border-primary transition-colors"
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
