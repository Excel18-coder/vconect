const { sql } = require('../../config/database');
const logger = require('../../utils/logger');
const mpesaService = require('../../services/payment/mpesa-service');
const notificationService = require('../../services/notification-service');

/**
 * Handle M-Pesa STK Push Callback
 */
exports.handleStkCallback = async (req, res) => {
    try {
        const callbackData = await mpesaService.handleCallback(req.body);
        const { success, checkoutRequestId, mpesaReceiptNumber, amount } = callbackData;

        if (success) {
            // Find the booking by checkoutRequestId (which we stored in payment_id or similar)
            const booking = await sql`
        SELECT b.*, u.email, u.phone, u.display_name, s.departure_time, mr.route_name, mo.name as operator_name
        FROM matatu_bookings b
        JOIN users u ON b.user_id = u.id
        JOIN matatu_schedules s ON b.schedule_id = s.id
        JOIN matatu_routes mr ON s.route_id = mr.id
        JOIN matatu_operators mo ON mr.operator_id = mo.id
        WHERE b.payment_id = ${checkoutRequestId}
      `;

            if (booking.length > 0) {
                const b = booking[0];

                await sql`BEGIN`;

                // Update booking status
                await sql`
          UPDATE matatu_bookings 
          SET status = 'confirmed', updated_at = NOW()
          WHERE id = ${b.id}
        `;

                // Create a record in matatu_payments
                await sql`
          INSERT INTO matatu_payments (
            booking_id, user_id, amount, payment_method, status, transaction_id, created_at
          ) VALUES (
            ${b.id}, ${b.user_id}, ${amount}, 'mpesa', 'success', ${mpesaReceiptNumber}, NOW()
          )
        `;

                await sql`COMMIT`;

                logger.info(`Payment confirmed for booking ${b.booking_reference}. Notifying user...`);

                // Notify user
                await notificationService.notifyBookingConfirmation(
                    { email: b.email, phone: b.phone, display_name: b.display_name },
                    {
                        booking_reference: b.booking_reference,
                        operator_name: b.operator_name,
                        route_name: b.route_name,
                        departure_time: b.departure_time,
                        seats_booked: JSON.parse(b.seats_booked),
                        total_price: b.total_price
                    }
                );
            } else {
                logger.warn(`Booking not found for CheckoutRequestID: ${checkoutRequestId}`);
            }
        } else {
            // Handle failed payment if needed
            logger.warn(`Payment failed for CheckoutRequestID: ${checkoutRequestId}`);
        }

        // Always respond with success to Safaricom
        return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
        logger.error('M-Pesa callback handler error:', error);
        return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
    }
};
