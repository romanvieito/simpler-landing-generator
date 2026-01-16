## Simpler Landing Generator of the World

Next.js + Tailwind app that turns a short prompt into a shareable landing-page preview for busy small business owners. Built to deploy on Vercel from a GitHub repo.

### Running locally

```bash
npm install
# copy env.example to .env.local and fill in Clerk keys
npm run dev
# open http://localhost:3000
```

### How it works
- Home page: enter a prompt (what you sell, who you serve) and click Generate.
- API: `/api/generate` returns structured copy (headline, subhead, features, CTA).
- Preview: shareable link at `/preview?prompt=your+text` renders the generated landing.

### Authentication (Clerk)
1. Create a Clerk application and grab the **Publishable key** and **Secret key**.
2. Copy `env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - (optional) adjust the sign-in/up URLs if you change the routes.
3. The homepage is public, but generation (`/api/generate`) requires a signed-in user. Use the header auth button or `/sign-in` and `/sign-up`.

### Contact Forms (Optional)
Generated landing pages now include working contact forms that store submissions and send email notifications:

1. **Database**: Uses your existing Vercel Postgres database
2. **Email notifications**: Set up Resend for email alerts when forms are submitted
3. **Environment variables** (optional):
   - `RESEND_API_KEY`: Your Resend API key for email notifications

Email notifications are automatically sent to the **site creator's email** (from their Clerk account). Without the Resend API key, forms still work but skip email notifications. Submissions are always stored in the database.

### Credit System
**New users get $1 in free credits** to test the service. After that, users must purchase credits to continue generating landing pages. We charge a fixed **$0.20 per landing page**.

#### Free Testing Credits
- **New users**: $1 in credits (enough for 20 landing pages)
- **Returning users**: $1 daily refresh when balance is low

#### Setup
1. **Stripe Integration**: Create a Stripe account and get your API keys
2. **Environment variables**:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Webhook endpoint secret (for payment confirmations)
   - `NEXT_PUBLIC_APP_URL`: Your app's URL (for Stripe redirects)

#### Credit Packages
- **5 Credits ($5)**: Perfect for testing (100 landing pages)
- **15 Credits ($12)**: Great for multiple landing pages (240 landing pages)
- **50 Credits ($30)**: Ideal for agencies (600 landing pages)

**1 credit = $1.00**. Each landing page costs $0.20 (fixed price).

#### Webhook Setup
1. In your Stripe dashboard, go to **Webhooks**
2. Add endpoint: `https://your-domain.com/api/credits/webhook`
3. Select event: `checkout.session.completed`
4. Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

## 🔍 API Cost Monitoring

The application includes comprehensive monitoring to ensure pricing integrity and profitability.

### Automated Monitoring

#### GitHub Actions (CI/CD)
- **Pre-deployment checks**: Runs on every push to main branch
- **Daily monitoring**: Scheduled cost analysis every 24 hours
- **Pricing alerts**: Detects DeepSeek API pricing changes
- **Manual triggers**: Run specific checks via workflow dispatch

#### Available Scripts
```bash
# Run all pre-deployment checks
npm run ci:pre-deploy

# Check for DeepSeek pricing changes
npm run monitor:pricing

# Analyze costs (24h, 7d, 30d periods)
npm run monitor:costs 24h
npm run monitor:costs 7d

# Validate cost calculations
npm run test:costs

# Run deployment monitor (comprehensive check)
npm run monitor:deploy
```

### Setting up GitHub Secrets

Add these secrets to your GitHub repository:

```
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
VERCEL_TOKEN=your_vercel_token
```

### Monitoring Alerts

The system provides alerts for:
- **Pricing changes**: When DeepSeek updates their API costs
- **High costs**: Transactions exceeding expected thresholds
- **Low margins**: Profit margins below expected levels
- **Negative profits**: Critical alerts if costs exceed revenue

### Manual Monitoring

Run these commands locally or in production:

```bash
# Check current pricing
npm run monitor:pricing

# Analyze recent costs
npm run monitor:costs 24h

# Validate all calculations
npm run test:costs
```

### Vercel Deployment

The `vercel.json` includes pre-deployment checks:
```json
{
  "buildCommand": "npm run ci:pre-deploy && npm run build"
}
```

This ensures deployments only proceed if all pricing checks pass.

### Tests and lint
```bash
npm run lint
```

### Deploying to Vercel
1. Push to GitHub.
2. In Vercel, **New Project → Import GitHub repo**.
3. Framework: Next.js. No extra build settings needed (`npm run build`).
4. Add the Clerk environment variables in Vercel → **Settings → Environment Variables** (same keys as `.env.local`).
5. Deploy and set a production domain. Preview links work automatically from the deployed origin.

### Publishing “free to share” landing pages (Vercel Deployments API)
This app can publish generated HTML to Vercel using `VERCEL_TOKEN`.

- **Recommended**: set `VERCEL_PUBLISH_PROJECT` to a dedicated project name (e.g. `simpler-published-sites`) so we **do not create one Vercel project per site**.
- **Important**: do **not** set `VERCEL_PUBLISH_PROJECT` to your main app’s project name, or you’ll overwrite its deployments.
- If published links prompt for login, disable it once on that dedicated project:
  - **Project → Settings → Deployment Protection → None** (and ensure **Vercel Authentication** is disabled)

### Custom Domains with easyland.site

Instead of Vercel URL renaming (which doesn't work in shared project mode), you can now set custom subdomains on your easyland.site domain.

#### How it works:
1. User enters a subdomain name (e.g., "mysite")
2. System sets the custom domain to `mysite.easyland.site`
3. You need to configure DNS to point the subdomain to the Vercel deployment

#### DNS Setup Required:
For each subdomain, add a CNAME record in your DNS provider (where easyland.site is configured):

- **Name**: `mysite` (just the subdomain part, not the full domain)
- **Type**: CNAME
- **Value**: Your Vercel deployment URL (e.g., `simpler-published-sites.vercel.app`)

#### Example DNS Records for easyland.site:
```
Type: CNAME
Name: mysite
Value: simpler-published-sites.vercel.app

Type: CNAME
Name: anothersite
Value: simpler-published-sites.vercel.app
```

#### Vercel Configuration:
1. Add `easyland.site` as a domain in your Vercel project
2. Enable SSL for the domain
3. Make sure your project allows deployments from this domain

#### ✅ **Custom Domains Now Work!**
Custom subdomains work properly with server-side routing. Each subdomain serves its specific site's content through the main app's routing system.

#### Manual DNS Setup:
After a user sets a custom domain, you'll need to manually add the DNS record, or set up automated DNS management with your DNS provider's API.

### Domain Renewal Policy

**Important**: Domains purchased through this application do **NOT** auto-renew. When a domain expires:

1. The domain will become unavailable
2. Users must manually renew through the planned Domain Management Dashboard
3. No automatic charges will occur
4. This prevents unexpected costs and gives users control over renewals

The domain purchase explicitly sets `renew: false` in the Vercel API to prevent auto-renewal.
