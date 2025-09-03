# Plisio Setup Guide

This guide will help you set up Plisio crypto payment integration for your NestJS application.

## 🚀 Quick Setup

### 1. Create Plisio Account
1. Go to [Plisio.net](https://plisio.net/) and sign up
2. Complete account verification
3. Go to **Settings** → **API Keys**
4. Generate a new **Secret Key**
5. Copy the API key for use in your environment variables

### 2. Environment Variables
Add these variables to your `.env` file:

```env
# Plisio Configuration
PLISIO_API_KEY=your_plisio_secret_key_here
PLISIO_CALLBACK_URL=https://yourdomain.com/payments/webhook

# Example for development
# PLISIO_CALLBACK_URL=https://your-ngrok-url.ngrok.io/payments/webhook
```

⚠️ **Important**: For development, use a tool like [ngrok](https://ngrok.com/) to expose your localhost to the internet so Plisio can send webhooks.

### 3. Webhook URL Setup
1. In your Plisio dashboard, go to **Settings** → **Webhooks**
2. Set your webhook URL to: `https://yourdomain.com/payments/webhook`
3. Enable webhooks for payment status updates

## 📋 Required Dependencies

Make sure you have these packages installed:

```bash
npm install axios @nestjs/config
```

## 🎯 API Endpoints

### User Endpoints

#### Create Crypto Payment
```http
POST /payments/crypto/create
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 50.00,
  "currency": "USD",
  "cryptoCurrency": "BTC",
  "description": "Wallet top-up",
  "orderName": "Crypto Payment"
}
```

**Response:**
```json
{
  "cryptoPayment": {
    "id": "...",
    "invoiceId": "plisio_invoice_id",
    "orderNumber": "CRYPTO1234567890ABC",
    "amount": 50,
    "currency": "USD",
    "cryptoAmount": 0.00123456,
    "cryptoCurrency": "BTC",
    "status": "new",
    "invoiceUrl": "https://plisio.net/invoice/...",
    "walletAddress": "bc1q...",
    "expiresAt": "2024-01-02T12:00:00.000Z"
  },
  "transaction": {
    "id": "...",
    "amount": 50,
    "status": "pending",
    "paymentMethod": "Crypto - BTC",
    "reference": "CRYPTO1234567890ABC"
  }
}
```

#### Get Payment Status
```http
GET /payments/crypto/{orderNumber}
Authorization: Bearer <jwt-token>
```

#### Get User's Crypto Payments
```http
GET /payments/crypto?page=1&limit=10
Authorization: Bearer <jwt-token>
```

#### Get Supported Currencies
```http
GET /payments/crypto/currencies
```

### Admin Endpoints

#### Get All Crypto Payments (Admin)
```http
GET /payments/admin/crypto?page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

#### Get Specific Payment (Admin)
```http
GET /payments/admin/crypto/{orderNumber}
Authorization: Bearer <admin-jwt-token>
```

### Webhook Endpoint (No Auth Required)
```http
POST /payments/webhook
Content-Type: application/json

{
  "invoice_id": "plisio_invoice_id",
  "status": "completed",
  "order_number": "CRYPTO1234567890ABC",
  "amount": "50.00",
  "currency": "USD",
  "source_currency": "BTC",
  "txn_id": "blockchain_transaction_id",
  "confirmations": "3"
}
```

## 🔄 Payment Flow

1. **User initiates payment**
   - Calls `POST /payments/crypto/create`
   - Receives payment URL and crypto wallet address

2. **User pays with crypto**
   - Uses the provided wallet address
   - Sends exact crypto amount shown

3. **Plisio processes payment**
   - Monitors blockchain for transaction
   - Sends status updates via webhooks

4. **Payment completion**
   - Webhook confirms payment
   - User's wallet balance is updated
   - Transaction status becomes "successful"

## 💰 Supported Cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Litecoin (LTC)
- Tether (USDT)
- USD Coin (USDC)
- Binance Coin (BNB)
- Dogecoin (DOGE)

## 🐛 Testing

### Development Testing
1. Use ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```

2. Update your `.env` with the ngrok URL:
   ```env
   PLISIO_CALLBACK_URL=https://your-random-id.ngrok.io/payments/webhook
   ```

3. Create a test payment and use Plisio's testnet for testing

### Production Setup
1. Use your production domain for webhook URL
2. Ensure SSL certificate is properly configured
3. Monitor webhook delivery in Plisio dashboard

## ⚠️ Important Notes

1. **Security**: Never expose your Plisio API key in client-side code
2. **Webhooks**: Always verify webhook data before processing
3. **Timeouts**: Crypto payments typically expire after 24 hours
4. **Confirmations**: Wait for sufficient blockchain confirmations before crediting accounts
5. **Error Handling**: Implement proper error handling for API failures

## 📊 Payment Status Mapping

| Plisio Status | Internal Status | Description |
|---------------|----------------|-------------|
| new | NEW | Payment created, waiting for crypto |
| pending | PENDING | Crypto received, waiting for confirmations |
| confirming | CONFIRMING | Getting blockchain confirmations |
| completed | COMPLETED | Payment confirmed and processed |
| error | ERROR | Payment failed |
| expired | EXPIRED | Payment timeout |
| cancelled | CANCELLED | Payment cancelled |

## 🔧 Troubleshooting

### Common Issues

1. **Webhook not received**
   - Check if webhook URL is accessible from internet
   - Verify SSL certificate
   - Check Plisio dashboard for delivery attempts

2. **API key errors**
   - Ensure API key is correctly set in environment variables
   - Verify API key is active in Plisio dashboard

3. **Payment not updating**
   - Check webhook endpoint logs
   - Verify invoice ID exists in database
   - Check Plisio dashboard for payment status

### Debug Mode
Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will show detailed logs for payment processing and webhook handling.
