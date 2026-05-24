const logger = require('../utils/logger');

/**
 * Notification Service
 * Handles sending of SMS and Emails
 */
class NotificationService {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.twilioConfig = {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            from: process.env.TWILIO_FROM_NUMBER,
        };
        this.emailConfig = {
            apiKey: process.env.SENDGRID_API_KEY,
            from: process.env.EMAIL_FROM_ADDRESS || 'noreply@vconect.com',
        };
    }

    /**
     * Send SMS via Twilio (or mock in dev)
     * @param {string} to Phone number in E.164 format
     * @param {string} message SMS body
     */
    async sendSMS(to, message) {
        try {
            if (this.isDevelopment || !this.twilioConfig.accountSid) {
                logger.info(`[MOCK SMS] To: ${to} | Message: ${message}`);
                return { success: true, sid: 'mock_sid_' + Date.now() };
            }

            // Real Twilio implementation would go here
            // const client = require('twilio')(this.twilioConfig.accountSid, this.twilioConfig.authToken);
            // const response = await client.messages.create({ body: message, from: this.twilioConfig.from, to });
            // return { success: true, sid: response.sid };

            logger.warn('Twilio integration placeholder reached in production');
            return { success: false, message: 'Twilio not configured' };
        } catch (error) {
            logger.error('SMS sending error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send Email via SendGrid (or mock in dev)
     * @param {string} to Recipient email
     * @param {string} subject Email subject
     * @param {string} body Email body (HTML)
     */
    async sendEmail(to, subject, body) {
        try {
            if (this.isDevelopment || !this.emailConfig.apiKey) {
                logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
                return { success: true, id: 'mock_email_id_' + Date.now() };
            }

            // Real SendGrid implementation would go here
            // const sgMail = require('@sendgrid/mail');
            // sgMail.setApiKey(this.emailConfig.apiKey);
            // const msg = { to, from: this.emailConfig.from, subject, html: body };
            // await sgMail.send(msg);
            // return { success: true };

            logger.warn('SendGrid integration placeholder reached in production');
            return { success: false, message: 'SendGrid not configured' };
        } catch (error) {
            logger.error('Email sending error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Notify user of successful booking
     * @param {object} user User object with email and phone
     * @param {object} booking Booking object with reference and details
     */
    async notifyBookingConfirmation(user, booking) {
        const smsMessage = `Booking Confirmed! Ref: ${booking.booking_reference}. ${booking.operator_name} to ${booking.route_name} at ${new Date(booking.departure_time).toLocaleString()}. Safe travels with VCONECT!`;

        const emailBody = `
      <h1>Booking Confirmed!</h1>
      <p>Dear ${user.display_name || 'Customer'},</p>
      <p>Your matatu booking has been confirmed.</p>
      <ul>
        <li><strong>Reference:</strong> ${booking.booking_reference}</li>
        <li><strong>Operator:</strong> ${booking.operator_name}</li>
        <li><strong>Route:</strong> ${booking.route_name}</li>
        <li><strong>Departure:</strong> ${new Date(booking.departure_time).toLocaleString()}</li>
        <li><strong>Seats:</strong> ${booking.seats_booked.join(', ')}</li>
        <li><strong>Total Price:</strong> KES ${booking.total_price}</li>
      </ul>
      <p>Thank you for choosing VCONECT!</p>
    `;

        const results = await Promise.all([
            user.phone ? this.sendSMS(user.phone, smsMessage) : Promise.resolve(null),
            this.sendEmail(user.email, `Booking Confirmation: ${booking.booking_reference}`, emailBody)
        ]);

        return {
            sms: results[0],
            email: results[1]
        };
    }
}

module.exports = new NotificationService();
