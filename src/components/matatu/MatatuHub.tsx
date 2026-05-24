import { useState } from 'react';
import MatatuSearch from '@/components/matatu/MatatuSearch';
import MatatuResults from '@/components/matatu/MatatuResults';
import SeatSelector from '@/components/matatu/SeatSelector';
import BookingCheckout from '@/components/matatu/BookingCheckout';
import MyBookings from '@/components/matatu/MyBookings';
import MatatuTracking from '@/components/matatu/MatatuTracking';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader } from 'lucide-react';
import { API_CONFIG, getAuthHeaders } from '@/config/api';
import { toast } from 'sonner';

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

interface SearchCriteria {
  from: string;
  to: string;
  date: string;
  passengers: number;
}

type BookingStep = 'search' | 'results' | 'seats' | 'checkout' | 'confirmation' | 'mybookings' | 'tracking';

const MatatuHub = ({ userId }: { userId?: string }) => {
  const [step, setStep] = useState<BookingStep>('search');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [results, setResults] = useState<MatatuResult[]>([]);
  const [selectedMatatu, setSelectedMatatu] = useState<MatatuResult | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleSearch = async (criteria: {
    from: string;
    to: string;
    date: string;
    passengers: number;
  }) => {
    setIsLoading(true);
    setSearchCriteria(criteria);

    try {
      const url = `${API_CONFIG.BASE_URL}/transport/routes?from=${encodeURIComponent(criteria.from)}&to=${encodeURIComponent(criteria.to)}&date=${criteria.date}&passengers=${criteria.passengers}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.schedules || []);
      setStep('results');
    } catch (error) {
      toast.error('Failed to search matatus. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMatatu = (matatu: MatatuResult) => {
    setSelectedMatatu(matatu);
    setStep('seats');
  };

  const handleSeatsSelected = (seats: number[]) => {
    setSelectedSeats(seats);
    setStep('checkout');
  };

  const handleConfirmPayment = async (paymentMethod: 'mpesa' | 'card' | 'cash') => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/transport/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          schedule_id: selectedMatatu?.id,
          seats_booked: selectedSeats,
          payment_method: paymentMethod,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const bookingRef = data.booking?.booking_reference || data.booking_reference;
      if (bookingRef) {
        setBookingReference(bookingRef);
        setStep('confirmation');
      } else {
        toast.error('Booking failed. Please try again.');
      }
    } catch (error) {
      toast.error('Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLoadingMessage = () => {
    if (step === 'checkout' && isLoading) return "Initiating M-Pesa STK Push... Please check your phone.";
    if (isLoading) return "Processing your request...";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      {step !== 'search' && step !== 'mybookings' && step !== 'tracking' && (
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (step === 'results') {
                setStep('search');
              } else if (step === 'seats') {
                setStep('results');
              } else if (step === 'checkout') {
                setStep('seats');
              } else {
                setStep('search');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            {step === 'results' && 'Select a matatu'}
            {step === 'seats' && `Select seats - ${selectedMatatu?.operator_name}`}
            {step === 'checkout' && 'Complete your booking'}
            {step === 'confirmation' && 'Booking confirmed!'}
          </div>
        </div>
      )}

      {/* Search Step */}
      {step === 'search' && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Book Your Matatu</h2>
          <MatatuSearch onSearch={handleSearch} isLoading={isLoading} />

          {isLoading && (
            <div className="mt-4 flex items-center justify-center p-4 bg-muted rounded-lg animate-pulse">
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm font-medium">{getLoadingMessage()}</span>
            </div>
          )}

          {/* Quick Link to My Bookings */}
          {userId && (
            <Button
              variant="outline"
              onClick={() => setStep('mybookings')}
              className="mt-4 w-full"
            >
              View My Bookings
            </Button>
          )}
        </Card>
      )}

      {/* Results Step */}
      {step === 'results' && (
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing results for <strong>{searchCriteria?.from}</strong> to{' '}
              <strong>{searchCriteria?.to}</strong> on{' '}
              <strong>{new Date(searchCriteria?.date || '').toLocaleDateString()}</strong>
            </p>
          </div>
          <MatatuResults
            results={results}
            isLoading={isLoading}
            onSelectMatatu={handleSelectMatatu}
          />
        </Card>
      )}

      {/* Seat Selection Step */}
      {step === 'seats' && selectedMatatu && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Select Your Seats</h3>
          <SeatSelector
            scheduleId={selectedMatatu.id}
            totalSeats={selectedMatatu.available_seats + (selectedSeats.length || 0)}
            onSelectSeats={handleSeatsSelected}
            maxSeats={5}
          />
        </Card>
      )}

      {/* Checkout Step */}
      {step === 'checkout' && selectedMatatu && selectedSeats.length > 0 && (
        <Card className="p-6">
          <BookingCheckout
            matatu={selectedMatatu}
            selectedSeats={selectedSeats}
            onConfirmPayment={handleConfirmPayment}
            isLoading={isLoading}
          />
        </Card>
      )}

      {/* Confirmation Step */}
      {step === 'confirmation' && bookingReference && (
        <Card className="p-6 text-center space-y-4">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
          <p className="text-muted-foreground">
            Your booking has been confirmed. Check your email for the ticket.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
            <p className="text-2xl font-bold text-primary">{bookingReference}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={() => {
                setStep('search');
                setSelectedMatatu(null);
                setSelectedSeats([]);
                setBookingReference(null);
              }}
              variant="outline"
            >
              Book Another
            </Button>
            <Button onClick={() => setStep('mybookings')}>View My Bookings</Button>
          </div>
        </Card>
      )}

      {/* My Bookings Step */}
      {step === 'mybookings' && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">My Bookings</h2>
            <Button
              variant="outline"
              onClick={() => setStep('search')}
            >
              Book New
            </Button>
          </div>
          <MyBookings
            userId={userId}
            onTrackBooking={(bookingId) => {
              setTrackingData({ bookingId });
              setStep('tracking');
            }}
          />
        </Card>
      )}

      {/* Tracking Step */}
      {step === 'tracking' && trackingData && (
        <Card className="p-6">
          <MatatuTracking
            bookingId={trackingData.bookingId}
            scheduleId={trackingData.scheduleId || ''}
            operatorName={trackingData.operatorName || 'Matatu'}
            routeName={trackingData.routeName || 'Route'}
            departureTime={trackingData.departureTime || new Date().toISOString()}
            status={trackingData.status || 'en_route'}
            onClose={() => setStep('mybookings')}
          />
        </Card>
      )}
    </div>
  );
};

export default MatatuHub;
