import { Button } from '@/components/ui/button';
import { Armchair, Star } from 'lucide-react';
import { useState } from 'react';

interface MatatuResult {
  id: string;
  operator_name: string;
  route_name: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  price_per_seat: number;
  duration?: string;
  rating?: number;
  reviews?: number;
}

interface MatatuResultsProps {
  results: MatatuResult[];
  isLoading?: boolean;
  onSelectMatatu: (matatu: MatatuResult) => void;
}

export default function MatatuResults({ results, isLoading = false, onSelectMatatu }: MatatuResultsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center">
        <Armchair className="mx-auto mb-3 h-12 w-12 opacity-50 text-muted-foreground" />
        <p className="text-muted-foreground">No matatus available for this route and date</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((matatu) => (
        <div
          key={matatu.id}
          className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${selectedId === matatu.id ? 'border-primary bg-primary/5' : ''}`}
          onClick={() => setSelectedId(matatu.id)}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-center">
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold">{matatu.operator_name}</h3>
              {matatu.rating ? (
                <div className="mt-1 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{matatu.rating}</span>
                  <span className="text-xs text-muted-foreground">({matatu.reviews} reviews)</span>
                </div>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{matatu.departure_time}</p>
                  <p className="text-xs text-muted-foreground">Depart</p>
                </div>
                <div className="relative h-0 flex-1 border-t-2 border-dashed">
                  <span className="absolute left-1/2 top-[-0.85rem] -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">
                    {matatu.duration || '~4h'}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{matatu.arrival_time}</p>
                  <p className="text-xs text-muted-foreground">Arrive</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 flex items-center gap-2">
              <Armchair className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">{matatu.available_seats}</p>
                <p className="text-xs text-muted-foreground">seats left</p>
              </div>
            </div>

            <div className="md:col-span-1 text-right">
              <p className="text-2xl font-bold text-primary">KES {matatu.price_per_seat}</p>
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectMatatu(matatu);
                }}
                className="mt-2 w-full"
                size="sm"
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
