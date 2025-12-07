# Vercel Deployment - Quick Reference

## Environment Variables Location

### For Vercel Production:
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add all variables listed in `.env.example`

### For Local Development:
Create a file named **`.env.local`** in the project root (same directory as `package.json`)

**Location:** `/Users/GabrielLeubitz/Downloads/scotty/.env.local`

## Required Environment Variables

### Client-Side (Browser) - Must start with `VITE_`
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

### Server-Side (API Routes) - NO `VITE_` prefix
```
FIREBASE_SERVICE_ACCOUNT  (entire JSON as string)
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIC
STRIPE_PRICE_PRO
AI_AGENT_API_KEY
SITE_URL
```

## Quick Deploy Steps

1. **Push to Git**: `git push origin main`
2. **Import to Vercel**: Connect your GitHub repo
3. **Add Environment Variables**: Copy from `.env.example`
4. **Deploy**: Vercel will auto-deploy

## Files Created for Vercel

- ✅ `vercel.json` - Vercel configuration
- ✅ `api/` folder - Serverless functions
  - `api/ai-proxy.ts`
  - `api/track-view.ts`
  - `api/billing/create-checkout-session.ts`
  - `api/webhooks/stripe.ts`
  - `api/external/v1/posts.ts` (already existed)
- ✅ `.env.example` - Template for environment variables
- ✅ `VERCEL_DEPLOYMENT.md` - Full deployment guide

## Where is the .env file?

**For Local Development:**
- Create `.env.local` in the project root: `/Users/GabrielLeubitz/Downloads/scotty/.env.local`
- This file is gitignored and won't be committed

**For Vercel:**
- Add environment variables in Vercel Dashboard → Settings → Environment Variables
- No `.env` file needed on Vercel (they're stored securely in Vercel's system)

