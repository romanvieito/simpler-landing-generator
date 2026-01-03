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
