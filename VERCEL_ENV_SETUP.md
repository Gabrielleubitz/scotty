# Vercel Environment Variables Setup

## ⚠️ Important: `.env.local` is ONLY for Local Development

The `.env.local` file in your project is **NOT** used by Vercel. You must add environment variables in the Vercel Dashboard.

## Steps to Add Environment Variables in Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Navigate to your project: `scotty-plum`

2. **Open Settings**
   - Click on your project
   - Go to **Settings** → **Environment Variables**

3. **Add `AI_AGENT_API_KEY`**
   - Click **Add New**
   - **Key**: `AI_AGENT_API_KEY`
   - **Value**: Your OpenAI API key (copy it from your `.env.local` file - it starts with `sk-proj-...`)
   - **Environment**: Select **Production**, **Preview**, and **Development** (or just Production if you only want it there)
   - Click **Save**

4. **Redeploy**
   - After adding the environment variable, Vercel will automatically trigger a new deployment
   - OR manually trigger a redeploy: Go to **Deployments** → Click the three dots on the latest deployment → **Redeploy**

## Required Environment Variables for AI Agent

### Server-Side (NO `VITE_` prefix)
```
AI_AGENT_API_KEY=sk-proj-...your-key-here...
```

## Testing After Setup

1. Wait for the deployment to complete
2. Go to your site: `https://scotty-plum.vercel.app`
3. Open Admin Dashboard → AI Agent Settings
4. Set **API URL** to: `https://api.openai.com/v1`
5. Click **Test API**

## Troubleshooting

- **404 Error**: The API route isn't being found. Check that the deployment completed successfully.
- **500 Error**: The environment variable isn't set. Double-check it's added in Vercel Dashboard.
- **403 Error**: The API route is being blocked. Check Vercel deployment logs.

