import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface BookingCheckoutProps {
  matatu: {
    operator_name: string;
    route_name: string;
    departure_time: string;
    arrival_time: string;
    price_per_seat: number;
  };
  selectedSeats: number[];
  onConfirmPayment: (paymentMethod: 'mpesa' | 'card' | 'cash') => Promise<void>;
  isLoading?: boolean;
}

export default function BookingCheckout({ matatu, selectedSeats, onConfirmPayment, isLoading = false }: BookingCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'card' | 'cash'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const totalPrice = matatu.price_per_seat * selectedSeats.length;

  const handlePayment = async () => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    if (paymentMethod === 'mpesa' && !phoneNumber) {
      alert('Please enter your M-Pesa phone number');
      return;
    }

    await onConfirmPayment(paymentMethod);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="text-lg font-semibold">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Operator:</span><span className="font-medium">{matatu.operator_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Route:</span><span className="font-medium">{matatu.route_name}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Departure:</span><span className="font-medium">{matatu.departure_time}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats:</span><span className="font-medium text-primary">{selectedSeats.join(', ')}</span></div>
          <div className="flex justify-between border-t border-blue-200 pt-2 font-semibold">
            <span>Total ({selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}):</span>
            <span className="text-lg text-primary">KES {totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Payment Method</h3>

        <label className="flex cursor-pointer items-start rounded-lg border-2 p-4 transition-colors" style={{ borderColor: paymentMethod === 'mpesa' ? '#1f2937' : '#e5e7eb' }}>
          <input type="radio" name="payment" value="mpesa" checked={paymentMethod === 'mpesa'} onChange={() => setPaymentMethod('mpesa')} className="mt-1" />
          <div className="ml-3 flex-1">
            <p className="font-medium">M-Pesa</p>
            <p className="text-sm text-muted-foreground">Fast & secure mobile money</p>
          </div>
        </label>

        {paymentMethod === 'mpesa' && (
          <div className="ml-8 space-y-2">
            <label className="block text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              placeholder="254712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">You'll receive an M-Pesa prompt on this number</p>
          </div>
        )}

        <label className="flex cursor-pointer items-start rounded-lg border-2 p-4 transition-colors" style={{ borderColor: paymentMethod === 'card' ? '#1f2937' : '#e5e7eb' }}>
          <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="mt-1" />
          <div className="ml-3 flex-1">
            <p className="font-medium">Card (Visa/Mastercard)</p>
            <p className="text-sm text-muted-foreground">Debit or credit card</p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start rounded-lg border-2 p-4 transition-colors" style={{ borderColor: paymentMethod === 'cash' ? '#1f2937' : '#e5e7eb' }}>
          <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="mt-1" />
          <div className="ml-3 flex-1">
            <p className="font-medium">Pay at Pickup</p>
            <p className="text-sm text-muted-foreground">Cash payment when boarding</p>
          </div>
        </label>
      </div>

      <div className="flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
        <div className="text-sm text-yellow-800">
          <p className="mb-1 font-medium">Important</p>
          <ul className="list-inside list-disc space-y-1 text-xs">
            <li>Arrive 15 minutes before departure</li>
            <li>Bring a valid ID for verification</li>
            <li>Cancellations allowed up to 2 hours before departure</li>
          </ul>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
        <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1" />
        <div className="text-sm">
          I agree to the terms and conditions and understand the cancellation policy
        </div>
      </label>

      <Button
        onClick={handlePayment}
        disabled={!agreedToTerms || (paymentMethod === 'mpesa' && !phoneNumber) || isLoading}
        className="h-12 w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : `Confirm Booking - KES ${totalPrice.toLocaleString()}`}
      </Button>
    </div>
  );
}
