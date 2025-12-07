# 🚀 Quick Start - Deploy Firestore Rules NOW

## The Problem
You're getting "Missing or insufficient permissions" errors because Firestore security rules haven't been deployed yet.

## The Solution (2 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **scotty-dccad**

### Step 2: Deploy Rules
1. Click **"Firestore Database"** in left menu
2. Click **"Rules"** tab at the top
3. **Delete everything** in the rules editor
4. **Copy the ENTIRE contents** of `firestore.rules` from this project
5. **Paste** into the rules editor
6. Click **"Publish"** button (top right)
7. Wait 30 seconds

### Step 3: Test
1. Refresh your browser (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
2. Try signing up/logging in again
3. ✅ Should work now!

## What Changed
The rules now allow:
- ✅ Authenticated users to query teams (for slug checking)
- ✅ Authenticated users to query team_members (for getUserTeams)
- ✅ Users to create teams (as owner)
- ✅ Users to create team_members (when creating team)
- ✅ App logic handles detailed authorization

## Still Not Working?

1. **Wait 1-2 minutes** after publishing (rules need time to propagate)
2. **Clear browser cache** completely
3. **Check Firebase Console** → Firestore → Rules to verify they're published
4. **Check browser console** for specific errors

## File Locations
- ✅ `firestore.rules` - Security rules (READY TO DEPLOY)
- ✅ `firebase.json` - Firebase config
- ✅ `firestore.indexes.json` - Database indexes

---

**Just copy `firestore.rules` into Firebase Console and publish!**

