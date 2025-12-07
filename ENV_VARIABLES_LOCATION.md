# Where Your Environment Variables Currently Are

## Current Status

Your Firebase configuration is **hardcoded as fallback values** in the code files. The database works because these hardcoded values are being used.

## Location of Current Values

### 1. Main App Firebase Config
**File:** `src/lib/firebase.ts` (lines 9-15)

```typescript
apiKey: "AIzaSyCOQBT98TQumcTJnCcXSKE1B0sycQkpoo0"
authDomain: "scotty-dccad.firebaseapp.com"
projectId: "scotty-dccad"
storageBucket: "scotty-dccad.firebasestorage.app"
messagingSenderId: "966416224400"
appId: "1:966416224400:web:d0476a8418665d42a0c815"
measurementId: "G-VBCDSSQXR2"
```

**Project:** `scotty-dccad` (This is the one currently working)

### 2. Widget Firebase Config
**File:** `public/widget.js` (lines 24-29)

```javascript
apiKey: "AIzaSyD7tlbe2_A9JCOAcpS7QNRkn9wcoLQ6bE4"
authDomain: "scotty-acfe5.firebaseapp.com"
projectId: "scotty-acfe5"
storageBucket: "scotty-acfe5.firebasestorage.app"
messagingSenderId: "1048370427467"
appId: "1:1048370427467:web:90127c22dbebc20eacffce"
```

**Project:** `scotty-acfe5` (Different project - may need updating)

### 3. Embed Code Generator Firebase Config
**File:** `src/components/EmbedCodeGenerator.tsx` (lines 11-16)

```typescript
apiKey: "AIzaSyD7tlbe2_A9JCOAcpS7QNRkn9wcoLQ6bE4"
authDomain: "scotty-acfe5.firebaseapp.com"
projectId: "scotty-acfe5"
storageBucket: "scotty-acfe5.firebasestorage.app"
messagingSenderId: "1048370427467"
appId: "1:1048370427467:web:90127c22dbebc20eacffce"
```

**Project:** `scotty-acfe5` (Different project - may need updating)

## What I've Done

✅ Created `.env.local` file in the project root with your working Firebase values from `scotty-dccad`

**Location:** `/Users/GabrielLeubitz/Downloads/scotty/.env.local`

## Next Steps

1. **Check which Firebase project you want to use:**
   - `scotty-dccad` (used in main app - currently working)
   - `scotty-acfe5` (used in widgets - may need to update)

2. **Update widget files** if you want to use the same project:
   - `public/widget.js`
   - `public/notification-widget.js`
   - `src/components/EmbedCodeGenerator.tsx`

3. **Add Firebase Service Account:**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Copy the JSON content
   - Add to `.env.local` as `FIREBASE_SERVICE_ACCOUNT` (entire JSON as string)

4. **For Vercel:**
   - Copy all values from `.env.local` to Vercel Dashboard → Environment Variables
   - Make sure client-side vars have `VITE_` prefix
   - Server-side vars should NOT have `VITE_` prefix

## Important Notes

- `.env.local` is gitignored and won't be committed
- The hardcoded values in code files act as fallbacks
- Once you set environment variables, they'll override the hardcoded values
- For production, always use environment variables (never commit secrets!)

