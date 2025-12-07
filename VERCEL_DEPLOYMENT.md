# Vercel Deployment Guide

## Quick Start

1. **Push your code to GitHub/GitLab/Bitbucket**
2. **Import to Vercel**: Go to [vercel.com](https://vercel.com) and import your repository
3. **Add Environment Variables** (see below)
4. **Deploy!**

## Environment Variables Setup

### Where to Add Environment Variables

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Environment Variables
   - Add each variable listed below

2. **For Local Development:**
   - Copy `.env.local.example` to `.env.local`
   - Fill in your values
   - `.env.local` is gitignored and won't be committed

### Required Environment Variables

#### Client-Side Variables (VITE_ prefix)
These are exposed to the browser and must start with `VITE_`:

```
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

#### Server-Side Variables (NO VITE_ prefix)
These are only available in API routes and serverless functions:

```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
STRIPE_SECRET_KEY=sk_live_...or_sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PRO=price_...
AI_AGENT_API_KEY=your-ai-agent-api-key
SITE_URL=https://your-domain.vercel.app
```

### Important Notes

1. **FIREBASE_SERVICE_ACCOUNT**: 
   - This should be the entire JSON content of your Firebase service account key
   - In Vercel, paste it as a single line (or use their multi-line editor)
   - For local dev, you can also place the JSON file in the project root

2. **SITE_URL**: 
   - Use your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - Or your custom domain if you have one

3. **Stripe Keys**:
   - Use test keys (`sk_test_...`) for development
   - Use live keys (`sk_live_...`) for production
   - Set different values for Preview/Development/Production environments in Vercel

## API Routes

The following API routes are available:

- `/api/external/v1/posts` - External API for posts (requires API key)
- `/api/ai-proxy` - AI agent proxy
- `/api/track-view` - Post view tracking
- `/api/billing/create-checkout-session` - Stripe checkout
- `/api/webhooks/stripe` - Stripe webhook handler

## Build Configuration

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: None (static site with serverless functions)
- **Node Version**: 20.x (configured in vercel.json)

## Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Firebase service account JSON added as `FIREBASE_SERVICE_ACCOUNT`
- [ ] Stripe keys configured
- [ ] `SITE_URL` set to your Vercel deployment URL
- [ ] Firebase Security Rules deployed
- [ ] Firebase Storage Rules deployed
- [ ] Test API routes after deployment

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure `npm run build` works locally first

### API Routes Return 500
- Check server-side environment variables are set (no `VITE_` prefix)
- Check Vercel function logs in dashboard
- Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON

### Client Can't Connect to Firebase
- Verify all `VITE_` prefixed variables are set
- Check browser console for errors
- Ensure Firebase project is configured correctly

### Stripe Webhooks Not Working
- Verify webhook URL in Stripe dashboard: `https://your-domain.vercel.app/api/webhooks/stripe`
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe webhook secret
- Review Vercel function logs for errors

