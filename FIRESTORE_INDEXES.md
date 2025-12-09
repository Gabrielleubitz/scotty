# Firestore Composite Indexes

## Quick Link to Create Indexes

**Direct link to Firestore Indexes page:**
https://console.firebase.google.com/project/scotty-dccad/firestore/indexes

## Your Current Indexes

Based on your Firestore console, you have:

1. **changelog** collection:
   - `status` (↑), `teamId` (↑), `createdAt` (↓), `__name__` (↓)
   - `teamId` (↑), `createdAt` (↓), `__name__` (↓)

2. **segments** collection:
   - `teamId` (↑), `name` (↑), `__name__` (↑)

## Analysis

Your existing index with `status` (↑), `teamId` (↑), `createdAt` (↓) **should work** for the widget posts query!

The query needs:
- `where('teamId', '==', teamId)`
- `where('status', '==', 'published')`
- `orderBy('createdAt', 'desc')`

For Firestore composite indexes:
- Equality fields (`where` clauses) can be in any order
- The `orderBy` field must come after all equality fields

Your index has equality fields first (`status`, `teamId`) and then the orderBy field (`createdAt`), which is correct!

## If You Still Get Errors

If you're still seeing index errors, try creating this index (fields in this specific order):

**Collection:** `changelog`

**Fields (in order):**
1. `teamId` - Ascending
2. `status` - Ascending  
3. `createdAt` - Descending

**Why this order:** Some Firestore queries are picky about field order. Having `teamId` first matches the query pattern better.

## How to Create (if needed)

1. Click the link above
2. Click "Add index" (blue button)
3. Set:
   - Collection ID: `changelog`
   - Fields:
     - Field: `teamId`, Order: `Ascending`
     - Field: `status`, Order: `Ascending`
     - Field: `createdAt`, Order: `Descending`
4. Click "Create"

**Note:** The API will work without this index (it falls back to in-memory sorting), but having the correct index will improve performance significantly.

