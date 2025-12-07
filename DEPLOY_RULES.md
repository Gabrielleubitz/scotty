# 🚨 CRITICAL: Deploy Firestore Security Rules

## You MUST deploy the security rules for the app to work!

The "Missing or insufficient permissions" errors you're seeing are because the Firestore security rules haven't been deployed to Firebase yet.

## Quick Fix (5 minutes)

### Option 1: Firebase Console (Easiest - Do This First!)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `scotty-dccad`
3. **Navigate to Firestore**: Click "Firestore Database" in the left menu
4. **Click "Rules" tab** at the top
5. **Copy the entire contents** of `firestore.rules` file from this project
6. **Paste into the rules editor** (replace everything)
7. **Click "Publish"** button
8. **Wait 1-2 minutes** for rules to propagate
9. **Refresh your browser** and try again

### Option 2: Firebase CLI (For Future Updates)

If you want to use the command line:

```bash
# Install Firebase CLI (if not installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore
# - Select your project: scotty-dccad
# - Use existing firestore.rules
# - Use existing firestore.indexes.json

# Deploy rules
firebase deploy --only firestore:rules
```

## Verify Rules Are Deployed

After deploying, you should see:
- ✅ No more "Missing or insufficient permissions" errors
- ✅ Can sign up/login
- ✅ Can create teams
- ✅ Can create posts

## What the Rules Do

The security rules enforce:
- ✅ Users can only access their own data
- ✅ Team members can only access their team's data
- ✅ Role-based permissions (owners/admins can manage)
- ✅ Public read access for analytics data
- ✅ Authenticated write access for tracking

## Still Having Issues?

1. **Clear browser cache** and refresh
2. **Wait 2-3 minutes** after deploying (rules take time to propagate)
3. **Check Firebase Console** → Firestore → Rules to verify they're published
4. **Check browser console** for specific permission errors

## Next Steps After Rules Are Deployed

1. ✅ Sign up a new user
2. ✅ Create your first team (auto-created on signup)
3. ✅ Create your first changelog post
4. ✅ Everything should work!

---

**The rules file is ready in `firestore.rules` - just copy and paste it into Firebase Console!**
