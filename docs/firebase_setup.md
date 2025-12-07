# Firebase Setup Guide

## Initial Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter project name: `scotty-dccad` (or your preferred name)
   - Follow the setup wizard

2. **Enable Authentication**
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
   - Enable "Google" (optional, for OAuth)

3. **Create Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Start in **test mode** (we'll deploy rules next)
   - Choose a location (e.g., `us-central1`)

4. **Enable Storage** (optional, for file uploads)
   - Go to Storage
   - Click "Get started"
   - Start in test mode

## Deploy Firestore Security Rules

The security rules are in `firestore.rules`. To deploy them:

### Option 1: Using Firebase CLI (Recommended)

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project
   - Use existing `firestore.rules` file
   - Use existing `firestore.indexes.json` file

4. **Deploy the rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Using Firebase Console

1. Go to Firestore Database → Rules
2. Copy the contents of `firestore.rules`
3. Paste into the rules editor
4. Click "Publish"

## Deploy Firestore Indexes

The indexes are in `firestore.indexes.json`. To deploy them:

### Using Firebase CLI:
```bash
firebase deploy --only firestore:indexes
```

### Using Firebase Console:
1. Go to Firestore Database → Indexes
2. Create indexes manually as needed (the app will prompt you when indexes are missing)

## Environment Variables

For local development, you can either:

1. **Use hardcoded values** (already in `src/lib/firebase.ts`)
2. **Use environment variables** (create `.env` file from `.env.example`)

The app will work with hardcoded values, but using environment variables is recommended for production.

## Testing Security Rules

After deploying rules, test them:

1. Try signing up a new user
2. Try creating a post
3. Try accessing another team's data (should be blocked)

## Troubleshooting

### "Missing or insufficient permissions" error

This means the Firestore security rules are not deployed or are too restrictive. 

**Solution:**
1. Deploy the security rules (see above)
2. Make sure you're authenticated (check Firebase Auth)
3. Verify the rules match your data structure

### Rules not updating

1. Clear browser cache
2. Wait a few minutes (rules can take time to propagate)
3. Check Firebase Console to verify rules are deployed

### Index errors

If you see "index required" errors:
1. Deploy indexes: `firebase deploy --only firestore:indexes`
2. Or create them manually in Firebase Console
3. Wait for indexes to build (can take a few minutes)

## Security Rules Overview

The rules enforce:

- **Users**: Can only read/write their own user document
- **Teams**: Only team members can read, only owners/admins can manage
- **Posts**: Team members can read, contributors+ can create/edit
- **Segments**: Team members can read, contributors+ can create/edit
- **API Keys**: Only owners/admins can manage
- **Analytics**: Public read, authenticated write

## Production Checklist

- [ ] Security rules deployed
- [ ] Indexes deployed
- [ ] Authentication methods enabled
- [ ] Firestore database created
- [ ] Storage bucket created (if using file uploads)
- [ ] Environment variables set (for production)
- [ ] Test signup/login flow
- [ ] Test creating posts
- [ ] Test team management

