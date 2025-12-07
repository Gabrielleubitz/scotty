# 🚨 Deploy Firebase Storage Rules

## The Problem
You're getting `403 Forbidden` errors when trying to upload images because Firebase Storage security rules haven't been deployed yet.

## Quick Fix (2 minutes)

### Option 1: Firebase Console (Easiest)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `scotty-dccad`
3. **Navigate to Storage**: Click "Storage" in the left menu
4. **Click "Rules" tab** at the top
5. **Copy the entire contents** of `storage.rules` file from this project
6. **Paste into the rules editor** (replace everything)
7. **Click "Publish"** button
8. **Wait 30 seconds**
9. **Try uploading an image again** - should work now!

### Option 2: Firebase CLI

```bash
# Deploy storage rules
firebase deploy --only storage
```

## What the Rules Allow

✅ **Authenticated users can:**
- Upload images to `changelog/` folder (max 10MB)
- Read images from `changelog/` folder
- Upload their own avatar to `avatars/{userId}/` (max 5MB)
- Read any avatar

❌ **Unauthenticated users:**
- Cannot upload anything
- Cannot read changelog images (but can read avatars)

## File Upload Limits

- **Changelog images**: 10MB max
- **User avatars**: 5MB max
- **Allowed types**: Images only (`image/*`)

## After Deploying

✅ Image uploads should work
✅ No more 403 errors
✅ Files will be stored in Firebase Storage

---

**Just copy `storage.rules` into Firebase Console and publish!**

