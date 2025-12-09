## Simpler Landing Generator of the World

Next.js + Tailwind app that turns a short prompt into a shareable landing-page preview for busy small business owners. Built to deploy on Vercel from a GitHub repo.

### Running locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

### How it works
- Home page: enter a prompt (what you sell, who you serve) and click Generate.
- API: `/api/generate` returns structured copy (headline, subhead, features, CTA).
- Preview: shareable link at `/preview?prompt=your+text` renders the generated landing.

### Tests and lint
```bash
npm run lint
```

### Deploying to Vercel
1. Push to GitHub.
2. In Vercel, **New Project → Import GitHub repo**.
3. Framework: Next.js. No extra build settings needed (`npm run build`).
4. Deploy and set a production domain. Preview links work automatically from the deployed origin.
