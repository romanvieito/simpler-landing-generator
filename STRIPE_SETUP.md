# Stripe Integration Setup Guide

This guide will help you set up and test the complete Stripe integration for credit purchases in your landing page generator.

## 🚀 Quick Start

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `env.example` to `.env.local` and fill in your Stripe credentials:
   ```bash
   cp env.example .env.local
   ```

3. **Configure Stripe credentials** in `.env.local`:
   ```env
   # Required Stripe keys
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Database (Vercel Postgres)
   POSTGRES_URL=your_postgres_connection_string

   # Stripe Price IDs (after running setup)
   STRIPE_PRICE_SMALL=price_...
   STRIPE_PRICE_MEDIUM=price_...
   STRIPE_PRICE_LARGE=price_...
   ```

4. **Set up Stripe products and prices**:
   ```bash
   npm run stripe:setup-products
   ```
   This creates products in your Stripe account and outputs price IDs.

5. **Update environment variables** with the price IDs from step 4.

6. **Test the integration**:
   ```bash
   npm run stripe:test-integration
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```

## 📋 Detailed Setup Steps

### 1. Stripe Account Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a new account or log in to existing one
3. Get your API keys from **Developers → API Keys**
4. Create a webhook endpoint:
   - Go to **Developers → Webhooks**
   - Add endpoint: `https://yourdomain.com/api/credits/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `invoice.payment_succeeded`, `invoice.payment_failed`
   - Copy the webhook signing secret

### 2. Environment Configuration

Required environment variables:

```env
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/db

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe Price IDs (filled after running setup script)
STRIPE_PRICE_SMALL=price_xxx
STRIPE_PRICE_MEDIUM=price_yyy
STRIPE_PRICE_LARGE=price_zzz
```

### 3. Database Setup

The application uses Vercel Postgres. Make sure your `POSTGRES_URL` is configured.

Tables are created automatically when the application starts:
- `user_credits` - User credit balances
- `credit_transactions` - Transaction history
- `stripe_logs` - Stripe event logging

### 4. Product Setup Script

Run the setup script to create products and prices in Stripe:

```bash
npm run stripe:setup-products
```

This creates three credit packages:
- **5 Credits** - $5.00 (price_small)
- **15 Credits** - $12.00 (price_medium)
- **50 Credits** - $30.00 (price_large)

The script outputs the price IDs that you need to add to your environment variables.

### 5. Webhook Configuration

Webhooks are crucial for processing payments. The system handles:

- `checkout.session.completed` - Main payment success
- `checkout.session.async_payment_succeeded` - Async payment success
- `checkout.session.async_payment_failed` - Async payment failure
- `invoice.payment_succeeded` - Invoice payments
- `invoice.payment_failed` - Failed invoice payments

Features:
- ✅ Idempotency (prevents duplicate processing)
- ✅ Comprehensive logging
- ✅ Error handling and recovery
- ✅ Customer management
- ✅ Credit transaction recording

### 6. Testing

#### Automated Tests

```bash
# Test webhook functionality
npm run stripe:test-webhook

# Comprehensive integration test
npm run stripe:test-integration
```

#### Manual Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the purchase flow**:
   - Log in to your application
   - Go to the dashboard or wherever credits are displayed
   - Click "Buy Credits" or "Add Credits"
   - Select a package and proceed to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`
   - Complete the payment

3. **Verify credit balance**:
   - Check that credits were added to your account
   - Verify transaction appears in credit history

4. **Test webhooks** (using Stripe CLI):
   ```bash
   # Install Stripe CLI
   npm install -g stripe

   # Login to Stripe
   stripe login

   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/credits/webhook

   # In another terminal, trigger a test event
   stripe trigger checkout.session.completed
   ```

## 🔧 Troubleshooting

### Common Issues

1. **"STRIPE_SECRET_KEY environment variable is required"**
   - Make sure your `.env.local` file exists and contains the correct keys
   - Restart your development server after changing environment variables

2. **"Invalid signature" webhook errors**
   - Verify your webhook secret matches the one in Stripe Dashboard
   - Make sure you're using the correct webhook endpoint URL

3. **Price IDs are placeholders**
   - Run `npm run stripe:setup-products` to create products
   - Update your environment variables with the generated price IDs

4. **Database connection errors**
   - Verify your `POSTGRES_URL` is correct
   - Make sure the database is running and accessible

5. **Checkout session creation fails**
   - Check that all price IDs are properly configured
   - Verify your Stripe API keys are correct

### Debug Commands

```bash
# Check environment variables
node -e "console.log(require('dotenv').config()); console.log(process.env.STRIPE_SECRET_KEY ? '✅ STRIPE_SECRET_KEY set' : '❌ STRIPE_SECRET_KEY missing')"

# Test Stripe API connection
curl -H "Authorization: Bearer $STRIPE_SECRET_KEY" https://api.stripe.com/v1/products

# Check database connection
node -e "require('dotenv').config(); const { sql } = require('@vercel/postgres'); sql\`SELECT 1\`.then(() => console.log('✅ DB connected')).catch(console.error)"

# View recent Stripe logs
# (Query the stripe_logs table in your database)
```

## 📊 Monitoring & Logs

The system includes comprehensive logging:

- **Stripe Events**: All webhook events are logged to the `stripe_logs` table
- **Credit Transactions**: All credit changes are tracked
- **Error Handling**: Failed operations are logged with details

To view logs:

```sql
-- View recent Stripe events
SELECT * FROM stripe_logs
ORDER BY created_at DESC
LIMIT 10;

-- View credit transactions for a user
SELECT * FROM credit_transactions
WHERE user_id = 'your_user_id'
ORDER BY created_at DESC;

-- Check credit balance
SELECT * FROM user_credits
WHERE user_id = 'your_user_id';
```

## 🚀 Production Deployment

### Vercel Deployment

1. **Set environment variables** in Vercel dashboard or CLI:
   ```bash
   vercel env add STRIPE_SECRET_KEY
   vercel env add STRIPE_WEBHOOK_SECRET
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   # ... add other required variables
   ```

2. **Update webhook URL** in Stripe Dashboard to point to your production domain

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Security Considerations

- ✅ Webhook signature verification
- ✅ Environment variables properly configured
- ✅ No sensitive data exposed to frontend
- ✅ Customer data handled securely
- ✅ PCI compliance (Stripe handles payment data)

## 📝 API Reference

### Credit Management APIs

- `GET /api/credits/balance` - Get user credit balance
- `POST /api/credits/create-checkout-session` - Create Stripe checkout session
- `POST /api/credits/webhook` - Handle Stripe webhooks

### Database Schema

```sql
-- User credits
CREATE TABLE user_credits (
  user_id TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  last_free_credits_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe event logs
CREATE TABLE stripe_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  amount INTEGER,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run the integration tests: `npm run stripe:test-integration`
3. Check Stripe Dashboard for error logs
4. Verify webhook delivery in Stripe Dashboard
5. Check application logs for detailed error messages

For Stripe-specific issues, refer to the [Stripe Documentation](https://stripe.com/docs).