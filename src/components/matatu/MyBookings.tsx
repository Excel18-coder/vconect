import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Ticket, AlertCircle, CheckCircle, XCircle, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { toast } from 'sonner';

interface Booking {
  id: string;
  operator_name: string;
  route_name: string;
  departure_time: string;
  arrival_time: string;
  seats_booked: number[];
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  booking_reference: string;
  created_at: string;
}

interface MyBookingsProps {
  userId?: string;
  onTrackBooking?: (bookingId: string) => void;
}

export default function MyBookings({ userId, onTrackBooking }: MyBookingsProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');

  useEffect(() => {
    // Fetch bookings from API
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/transport/bookings`, {
        credentials: 'include',
        headers: {
          ...getAuthHeaders(),
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/transport/bookings/${bookingId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ status: 'cancelled' }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        fetchBookings();
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleDownloadTicket = (bookingId: string) => {
    toast.message('Ticket download will be available shortly.');
  };

  const handleTrackBooking = (bookingId: string) => {
    if (onTrackBooking) {
      onTrackBooking(bookingId);
    } else {
      toast.message('Tracking is available from your booking details.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground mb-4">No bookings yet</p>
        <p className="text-sm text-muted-foreground">
          Search and book a matatu to see your bookings here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'upcoming', 'past', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg transition-colors capitalize ${
              filter === tab
                ? 'bg-primary text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-4">
              {/* Operator & Status */}
              <div>
                <h3 className="font-semibold text-lg">{booking.operator_name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(booking.status)}
                  <span className="text-xs text-muted-foreground">
                    Ref: {booking.booking_reference}
                  </span>
                </div>
              </div>

              {/* Route & Time */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Route</p>
                <p className="font-medium">{booking.route_name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {booking.departure_time} - {booking.arrival_time}
                </div>
              </div>

              {/* Seats */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Seats</p>
                <p className="font-semibold text-primary">{booking.seats_booked.join(', ')}</p>
              </div>

              {/* Price */}
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">
                  KES {booking.total_price.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadTicket(booking.id)}
              >
                <Ticket className="h-4 w-4 mr-2" />
                Download Ticket
              </Button>

              {booking.status === 'confirmed' && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleTrackBooking(booking.id)}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Track
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(booking.id)}
                  >
                    Cancel Booking
                  </Button>
                </>
              )}

              <Button variant="outline" size="sm" className="ml-auto">
                Contact Operator
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
