import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Armchair, Star } from 'lucide-react';
import { useState } from 'react';

interface MatafuResult {
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

interface MatafuResultsProps {
  results: MatafuResult[];
  isLoading?: boolean;
  onSelectMatatu: (matatu: MatafuResult) => void;
}

export default function MatafuResults({
  results,
  isLoading = false,
  onSelectMatatu,
}: MatafuResultsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Armchair className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground">No matatus available for this route and date</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((matatu) => (
        <div
          key={matatu.id}
          className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
            selectedId === matatu.id ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => setSelectedId(matatu.id)}
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Operator Info */}
            <div className="md:col-span-1">
              <h3 className="font-semibold text-lg">{matatu.operator_name}</h3>
              <div className="flex items-center gap-1 mt-1">
                {matatu.rating && (
                  <>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{matatu.rating}</span>
                    <span className="text-xs text-muted-foreground">
                      ({matatu.reviews} reviews)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{matatu.departure_time}</p>
                  <p className="text-xs text-muted-foreground">Depart</p>
                </div>
                <div className="flex-1 border-t-2 border-dashed relative h-0">
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-background px-2 text-xs text-muted-foreground">
                    {matatu.duration || '~4h'}
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{matatu.arrival_time}</p>
                  <p className="text-xs text-muted-foreground">Arrive</p>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <Armchair className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-semibold">{matatu.available_seats}</p>
                  <p className="text-xs text-muted-foreground">seats left</p>
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div className="md:col-span-1 text-right">
              <p className="text-2xl font-bold text-primary">KES {matatu.price_per_seat}</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMatatu(matatu);
                }}
                className="w-full mt-2 bg-gradient-to-r from-primary to-pink-500"
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
