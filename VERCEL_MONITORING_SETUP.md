# 🚀 Vercel + GitHub Actions Monitoring Setup

**The easiest way to set up monitoring - manage everything in Vercel!**

## 🎯 Quick Setup (5 minutes)

### Step 1: Check Your Vercel Environment Variables

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

You should already have these for your app:
- ✅ `DEEPSEEK_API_KEY`
- ✅ `DEEPSEEK_API_BASE` (optional)
- ✅ `DEEPSEEK_MODEL` (optional)

### Step 2: Get Your Vercel Token

1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: `GitHub Actions Monitoring`
4. Copy the token (keep it safe!)

### Step 3: Run the Setup Helper

```bash
npm run monitor:secrets
```

This interactive script will:
- Show you what secrets you need
- Guide you through copying from Vercel
- Generate step-by-step GitHub setup instructions

### Step 4: Add Secrets to GitHub

Follow the instructions from the setup script, or:

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret" for each:

```
Name: DEEPSEEK_API_KEY
Value: [copy from Vercel]

Name: DEEPSEEK_API_BASE
Value: https://api.deepseek.com

Name: DEEPSEEK_MODEL
Value: deepseek-chat

Name: VERCEL_TOKEN
Value: [paste your Vercel token from Step 2]
```

### Step 5: Test & Activate

```bash
# Test locally first
npm run monitor:pricing
npm run test:costs

# Push to GitHub to activate
git add .
git commit -m "Add API cost monitoring"
git push origin main
```

## 🔍 What Happens Next

### Automatic Monitoring Activates:
- ✅ **Every push to main**: Pricing validation before deployment
- ✅ **Daily at 9 AM UTC**: Cost analysis and alerts
- ✅ **DeepSeek price changes**: Immediate detection and blocking

### Vercel Deployment Protection:
- ✅ **Pre-deployment checks** run automatically
- ✅ **Deployment blocked** if pricing issues detected
- ✅ **Safe deployments** guaranteed

## 📊 Monitoring Dashboard

### View Results:
1. **GitHub Actions Tab**: See all monitoring runs
2. **Real-time Alerts**: Get notified of issues
3. **Cost Reports**: Daily profitability analysis

### Manual Controls:
```bash
# Check pricing manually
npm run monitor:pricing

# Analyze costs
npm run monitor:costs 24h

# Full deployment check
npm run monitor:deploy
```

## 🛡️ Protection Status

| Protection | Status | Details |
|------------|--------|---------|
| Pricing Changes | ✅ **ACTIVE** | Blocks deployment if DeepSeek changes costs |
| Cost Validation | ✅ **ACTIVE** | Ensures 50% profit margin always |
| Real-time Alerts | ✅ **ACTIVE** | High cost warnings and anomaly detection |
| Daily Monitoring | ✅ **ACTIVE** | Automated cost analysis and reporting |

## 🔧 Troubleshooting

### If GitHub Actions Fail:
1. Check secrets are added correctly in GitHub
2. Verify Vercel token has proper permissions
3. Run locally: `npm run monitor:pricing`

### If Secrets Issues:
```bash
# Re-run setup helper
npm run monitor:secrets

# Test individual components
npm run test:costs
npm run monitor:pricing
```

### Manual GitHub Setup:
If the script doesn't work, manually add these to GitHub secrets:

```
DEEPSEEK_API_KEY=your_key_from_vercel
DEEPSEEK_API_BASE=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
VERCEL_TOKEN=your_vercel_token
```

## 📞 Support

**Monitoring detects an issue?**
1. Check GitHub Actions logs for details
2. Update `lib/deepseek.ts` if pricing changed
3. Re-deploy after fixes

**Need help setting up?**
- Run `npm run monitor:setup` for full diagnostics
- Check `MONITORING_SETUP.md` for detailed docs

---

## ✅ Success Checklist

- [ ] Vercel environment variables configured
- [ ] Vercel token created and copied
- [ ] GitHub secrets added via `npm run monitor:secrets`
- [ ] Pushed code to activate monitoring
- [ ] First GitHub Actions run completed successfully
- [ ] Monitoring dashboard shows green checks

**🎉 You're now 100% protected against undetected pricing changes!**