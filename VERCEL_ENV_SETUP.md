# Vercel Environment Variables Setup

## Critical: FIREBASE_SERVICE_ACCOUNT

The `FIREBASE_SERVICE_ACCOUNT` environment variable **must be valid JSON** and set as a **single-line string** in Vercel.

## Quick Test

After setting the variable, test it with this endpoint:
**https://scotty-plum.vercel.app/api/widget/test-config**

This will show you:
- If the variable is set
- If it's valid JSON
- Common issues (single quotes, line breaks, etc.)
- The exact error position if parsing fails

## How to Set It Correctly

### Step 1: Get Your Firebase Service Account JSON

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### Step 2: Convert to Single-Line JSON

The JSON file will look like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### Step 3: Set in Vercel

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `FIREBASE_SERVICE_ACCOUNT`
   - **Value:** Paste the **entire JSON as a single line** (minified)
   
   **CRITICAL:** 
   - The JSON should be **1500-2000+ characters long**
   - If it's only 50-100 characters, you only pasted part of it!
   - Remove all line breaks
   - Keep it as one continuous string
   - Make sure all quotes are double quotes (`"`), not single quotes (`'`)
   - The entire JSON should be on one line
   - **Copy the ENTIRE file contents**, not just the first few lines

### Example (minified):

```
{"type":"service_account","project_id":"scotty-dccad","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
```

### Step 4: Verify

After setting the variable:
1. **Redeploy** your Vercel project (environment variables require a new deployment)
2. Check the function logs - you should see:
   - `✅ Successfully parsed FIREBASE_SERVICE_ACCOUNT`
   - `✅ Firebase Admin initialized with service account`

## Common Mistakes

❌ **Don't:** Set it as a multi-line JSON (Vercel will escape it incorrectly)
❌ **Don't:** Use single quotes instead of double quotes
❌ **Don't:** Forget to redeploy after setting the variable
❌ **Don't:** Include the file path or file reading code

✅ **Do:** Minify the JSON to a single line
✅ **Do:** Use double quotes for all property names and string values
✅ **Do:** Redeploy after setting environment variables
✅ **Do:** Test the API endpoint after deployment

## Quick Fix Script

If you have the JSON file locally, you can minify it with this command:

```bash
cat your-service-account.json | jq -c . > service-account-minified.json
```

Then copy the contents of `service-account-minified.json` into Vercel.

## Alternative: Use Vercel CLI

You can also set it via Vercel CLI:

```bash
vercel env add FIREBASE_SERVICE_ACCOUNT
# Paste the minified JSON when prompted
```
