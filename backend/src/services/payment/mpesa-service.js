const logger = require('../../utils/logger');
const axios = require('axios');

/**
 * M-Pesa (Daraja) Service
 * Handles STK Push and Payment Callbacks
 * 
 * To make this fully operational:
 * 1. Configure MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET
 * 2. Configure MPESA_SHORTCODE, MPESA_PASSKEY
 * 3. Configure MPESA_CALLBACK_URL (must be a public URL)
 */
class MpesaService {
    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
        this.config = {
            consumerKey: process.env.MPESA_CONSUMER_KEY,
            consumerSecret: process.env.MPESA_CONSUMER_SECRET,
            shortcode: process.env.MPESA_SHORTCODE || '174379', // Sandbox default
            passkey: process.env.MPESA_PASSKEY,
            callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://vconect.com/api/transport/mpesa/callback',
            apiUrl: process.env.MPESA_ENV === 'production'
                ? 'https://api.safaricom.co.ke'
                : 'https://sandbox.safaricom.co.ke',
        };
    }

    /**
     * Get OAuth2 Access Token
     */
    async getAccessToken() {
        const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64');
        try {
            const response = await axios.get(`${this.config.apiUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                headers: { Authorization: `Basic ${auth}` },
            });
            return response.data.access_token;
        } catch (error) {
            logger.error('M-Pesa auth error:', error.response?.data || error.message);
            throw new Error('Failed to authenticate with M-Pesa');
        }
    }

    /**
     * Trigger STK Push
     * @param {string} phoneNumber Phone number in 254XXXXXXXXX format
     * @param {number} amount Amount to charge
     * @param {string} reference Booking reference
     * @returns {object} Response with CheckoutRequestID
     */
    async stkPush(phoneNumber, amount, reference) {
        logger.info(`Starting STK Push for ${phoneNumber} - Amount: ${amount}`);

        // Normalize phone number: 07XXXXXXXX -> 2547XXXXXXXX
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('254')) {
            // already formatted
        } else {
            throw new Error('Invalid phone number format for M-Pesa. Use 07XXXXXXXX or 254XXXXXXXXX');
        }

        if (this.isDevelopment && !this.config.consumerKey) {
            logger.info(`[MOCK MPESA] STK Push to ${formattedPhone} for ${amount}. Ref: ${reference}`);
            return {
                success: true,
                MerchantRequestID: 'mock_merchant_' + Date.now(),
                CheckoutRequestID: 'mock_checkout_' + Date.now(),
                ResponseCode: '0',
                ResponseDescription: 'Mock Success',
                CustomerMessage: 'Success',
            };
        }

        try {
            const accessToken = await this.getAccessToken();
            const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
            const password = Buffer.from(`${this.config.shortcode}${this.config.passkey}${timestamp}`).toString('base64');

            const response = await axios.post(
                `${this.config.apiUrl}/mpesa/stkpush/v1/processrequest`,
                {
                    BusinessShortCode: this.config.shortcode,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: 'CustomerPayBillOnline',
                    Amount: Math.round(amount),
                    PartyA: formattedPhone,
                    PartyB: this.config.shortcode,
                    PhoneNumber: formattedPhone,
                    CallBackURL: this.config.callbackUrl,
                    AccountReference: reference,
                    TransactionDesc: `Booking ${reference}`,
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );

            return {
                success: true,
                ...response.data
            };
        } catch (error) {
            logger.error('M-Pesa STK Push error:', error.response?.data || error.message);
            return {
                success: false,
                message: error.response?.data?.errorMessage || 'Failed to initiate M-Pesa payment',
            };
        }
    }

    /**
     * Process Callback from M-Pesa
     * @param {object} body The JSON body from Safaricom callback
     */
    async handleCallback(body) {
        const { Body: { stkCallback } } = body;
        const checkoutRequestId = stkCallback.CheckoutRequestID;
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;

        if (resultCode === 0) {
            const metadata = stkCallback.CallbackMetadata.Item;
            const amount = metadata.find(item => item.Name === 'Amount')?.Value;
            const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
            const transactionDate = metadata.find(item => item.Name === 'TransactionDate')?.Value;
            const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber')?.Value;

            logger.info(`M-Pesa Payment Successful: ${mpesaReceiptNumber} - Amount: ${amount}`);

            return {
                success: true,
                checkoutRequestId,
                mpesaReceiptNumber,
                amount,
                phoneNumber,
                transactionDate,
            };
        } else {
            logger.warn(`M-Pesa Payment Failed: ${resultDesc} (Code: ${resultCode})`);
            return {
                success: false,
                checkoutRequestId,
                resultCode,
                resultDesc,
            };
        }
    }
}

module.exports = new MpesaService();
