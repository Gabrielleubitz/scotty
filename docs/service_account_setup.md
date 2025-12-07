# Firebase Service Account Setup

## Overview

The Firebase Admin SDK service account file is used for server-side operations in the API endpoints (like `/api/external/v1/posts`). This file contains credentials that allow server-side code to access Firestore with elevated permissions.

## File Location

The service account file should be placed in one of these locations (checked in order):

1. **Project root**: `scotty-dccad-firebase-adminsdk-fbsvc-6e304d870e.json`
2. **Config directory**: `config/firebase-service-account.json`
3. **Root with generic name**: `firebase-service-account.json`

## Security

⚠️ **IMPORTANT**: This file contains sensitive credentials and is automatically excluded from git via `.gitignore`.

**Never commit this file to version control!**

The following patterns are in `.gitignore`:
- `*-firebase-adminsdk-*.json`
- `firebase-service-account.json`
- `config/firebase-service-account.json`

## Local Development

For local development, place the service account file in the project root with its original name, or rename it to `firebase-service-account.json`.

The API code will automatically detect and use the file when running locally.

## Production (Vercel)

For production deployment on Vercel:

1. **Option 1: Environment Variable (Recommended)**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `FIREBASE_SERVICE_ACCOUNT` as the key
   - Paste the entire JSON content of the service account file as the value
   - Deploy

2. **Option 2: Vercel Secrets**
   - Use Vercel's secret management for sensitive data
   - Reference it in `vercel.json` or via environment variables

## How It Works

The API endpoint (`api/external/v1/posts.ts`) checks for the service account in this order:

1. `FIREBASE_SERVICE_ACCOUNT` environment variable (JSON string)
2. Local file: `scotty-dccad-firebase-adminsdk-fbsvc-6e304d870e.json`
3. Local file: `config/firebase-service-account.json`
4. Local file: `firebase-service-account.json`
5. Default credentials (if using `gcloud` CLI locally)

## Verification

To verify the service account is working:

1. Start your dev server: `npm run dev`
2. The API endpoint should initialize Firebase Admin on first use
3. Check the console logs for: `"Loaded Firebase service account from: ..."` or `"Initialized Firebase Admin with default credentials"`

## Troubleshooting

### "Firebase Admin not configured" error

- **Local**: Make sure the service account file is in the project root
- **Vercel**: Make sure `FIREBASE_SERVICE_ACCOUNT` environment variable is set
- Check file permissions (should be readable)

### "Permission denied" errors

- Verify the service account has the correct permissions in Firebase Console
- Check that Firestore is enabled in your Firebase project
- Verify the service account email has the "Firebase Admin SDK Administrator Service Agent" role

### File not found

- Verify the file exists in one of the expected locations
- Check the file name matches exactly (case-sensitive)
- Ensure the file is not corrupted

