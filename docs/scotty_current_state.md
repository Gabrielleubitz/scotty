# Scotty Current State Assessment

## Tech Stack

### Framework
- **Frontend Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.2 (not Next.js)
- **Entry Point**: `src/main.tsx` → `src/App.tsx`
- **Styling**: Tailwind CSS 3.4.1

### Backend Pattern
- **Pattern**: Client-side only (SPA)
- **API Layer**: Direct Firebase client SDK calls from React components
- **No Backend Server**: All data operations happen client-side via Firebase SDK
- **Edge Functions**: Netlify Edge Functions for:
  - `/api/ai-proxy` - Proxies AI agent requests
  - `/api/track-view` - Tracks widget views

### Database Layer
- **Database**: Firebase Firestore (NoSQL document database)
- **Storage**: Firebase Storage (for file uploads)
- **Authentication**: Firebase Auth
- **Collections Used**:
  - `changelog` - Changelog posts
  - `users` - User accounts and roles
  - `segments` - Domain-based segmentation
  - `visitors` - Visitor tracking data
  - `post_views` - Post view analytics
  - `widget_events` - Widget interaction events
  - `ai_config` - Per-user AI agent configuration (scoped by user.uid)
  - `language_settings` - Per-user language settings (scoped by user.uid)
  - `user_read_states` - User read state tracking (used in widget)

### Auth System
- **Provider**: Firebase Authentication
- **Methods Supported**:
  - Email/Password authentication
  - Google OAuth (via `signInWithPopup`)
- **User Model**: Stored in Firestore `users` collection
- **Roles**: `'admin'` | `'user'` (stored in user document)
- **Auth Hook**: `src/hooks/useAuth.ts` wraps `src/lib/auth.ts`

### Current Deployment
- **Platform**: Netlify (configured via `netlify.toml`)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/`
- **Edge Functions**: Located in `netlify/edge-functions/`
- **No Vercel Configuration**: Currently no `vercel.json` or Vercel-specific files

---

## Domain Model

### Core Entities

#### 1. **ChangelogPost** (`src/types/index.ts`)
- **Definition**: `src/types/index.ts:1-22`
- **Fields**:
  - `id: string`
  - `title: string`
  - `content: string`
  - `translations?: { [languageCode: string]: { title, content, isAIGenerated } }`
  - `videoUrl?: string`
  - `imageUrl?: string`
  - `category?: string`
  - `createdAt: Date`
  - `updatedAt: Date`
  - `views: number`
  - `publishedAt?: Date`
  - `scheduledFor?: Date`
  - `status: 'draft' | 'scheduled' | 'published'`
  - `segmentId?: string` - Links to Segment for domain-based filtering
- **Storage**: Firestore collection `changelog`
- **Dependencies**:
  - `src/lib/api.ts` - CRUD operations
  - `src/components/AdminDashboard.tsx` - Admin management
  - `src/components/ChangelogWidget.tsx` - Public display
  - `src/hooks/useChangelog.ts` - Data fetching hook

#### 2. **User** (`src/types/index.ts`)
- **Definition**: `src/types/index.ts:24-30`
- **Fields**:
  - `id: string` (Firebase Auth UID)
  - `email: string`
  - `name: string`
  - `avatar?: string`
  - `role: 'admin' | 'user'`
- **Storage**: Firestore collection `users` (document ID = Firebase Auth UID)
- **Dependencies**:
  - `src/lib/auth.ts` - Authentication and user creation
  - `src/hooks/useAuth.ts` - React hook for current user
  - `src/App.tsx` - User display and role-based UI
  - `src/components/AdminDashboard.tsx` - Admin-only features

#### 3. **Segment** (`src/types/index.ts`)
- **Definition**: `src/types/index.ts:78-85`
- **Fields**:
  - `id: string`
  - `name: string`
  - `domain: string` - Domain for filtering posts
  - `description?: string`
  - `createdAt: Date`
  - `updatedAt: Date`
- **Storage**: Firestore collection `segments`
- **Purpose**: Domain-based content segmentation (multi-tenant precursor)
- **Dependencies**:
  - `src/lib/api.ts` - CRUD operations
  - `src/components/SegmentManager.tsx` - Management UI
  - `src/lib/api.ts:filterPostsByDomain()` - Filters posts by current domain

#### 4. **ChatMessage** (`src/types/index.ts`)
- **Definition**: `src/types/index.ts:32-38`
- **Fields**:
  - `id: string`
  - `content: string`
  - `isUser: boolean`
  - `timestamp: Date`
  - `sessionId?: string`
- **Storage**: Firestore collection `widget_events` (filtered by `eventType === 'chat_message'`)
- **Dependencies**:
  - `src/components/ChatAgent.tsx` - Chat UI
  - `src/lib/api.ts:sendChatMessage()` - Sends messages via AI proxy

#### 5. **Analytics** (`src/types/index.ts`)
- **Definition**: `src/types/index.ts:40-47`
- **Fields**:
  - `totalViews: number`
  - `uniqueUsers: number`
  - `viewsOverTime: Array<{ date: string, views: number }>`
- **Storage**: Aggregated from `visitors` and `post_views` collections
- **Dependencies**:
  - `src/lib/api.ts:getAnalytics()` - Aggregates data
  - `src/components/AdminDashboard.tsx` - Analytics display
  - `src/components/AnalyticsChart.tsx` - Visualization

#### 6. **AIAgentConfig** (`src/types/index.ts`)
- **Definition**: `src/types/index.ts:49-53`
- **Fields**:
  - `apiToken: string`
  - `apiUrl: string`
  - `enabled: boolean`
- **Storage**: Firestore collection `ai_config` (document ID = user.uid) - **Per-user scoped**
- **Dependencies**:
  - `src/lib/api.ts:getAIAgentConfig()` - Gets config for current user
  - `src/components/AIAgentSettings.tsx` - Configuration UI

#### 7. **LanguageSettings** (`src/types/index.ts`)
- **Definition**: `src/types/index.ts:55-61`
- **Fields**:
  - `supportedLanguages: string[]`
  - `defaultLanguage: string`
  - `enabledLanguages: string[]`
  - `translationService: 'openai' | 'google' | 'deepl'`
  - `translationApiKey?: string`
- **Storage**: Firestore collection `language_settings` (document ID = user.uid) - **Per-user scoped**
- **Dependencies**:
  - `src/lib/api.ts:getLanguageSettings()` - Gets settings for current user
  - `src/components/LanguageSettings.tsx` - Settings UI

### Tracking Entities (Analytics)

#### 8. **Visitor** (implicit)
- **Storage**: Firestore collection `visitors`
- **Fields**: `userId`, `domain`, `timestamp`, `browser`, `os`, `country`, etc.
- **Dependencies**: `src/lib/tracking.ts`, `src/lib/api.ts:trackVisitor()`

#### 9. **PostView** (implicit)
- **Storage**: Firestore collection `post_views`
- **Fields**: `postId`, `userId`, `domain`, `timestamp`, `timeSpent`
- **Dependencies**: `src/lib/tracking.ts`, `src/lib/api.ts:trackPostView()`

---

## Auth and User Model

### How Scotty Knows the Current User

1. **Firebase Auth State**: `src/lib/auth.ts` uses `onAuthStateChanged()` to listen for auth changes
2. **User Document**: On sign-in, creates/reads user document from `users/{uid}` collection
3. **Auth Service**: `src/lib/auth.ts:AuthService` manages current user state
4. **React Hook**: `src/hooks/useAuth.ts` exposes `user` object to components
5. **Current User Access**: Components use `const { user } = useAuth()` to get current user

### Single-User Assumptions

#### Data NOT Scoped by User (Global/Shared Data)

1. **Changelog Posts** (`changelog` collection)
   - **Location**: `src/lib/api.ts:getChangelogPosts()`, `getAllChangelogPosts()`
   - **Issue**: All posts are global - no `userId` or `teamId` field
   - **Filtering**: Only by `segmentId` (domain-based), not by user/team ownership

2. **Segments** (`segments` collection)
   - **Location**: `src/lib/api.ts:getSegments()`, `createSegment()`, etc.
   - **Issue**: All segments are global - no ownership model
   - **Current Use**: Domain-based filtering only

3. **Analytics Data**
   - **Collections**: `visitors`, `post_views`, `widget_events`
   - **Location**: `src/lib/api.ts:getAnalytics()`, `getVisitorAnalytics()`, `getPostAnalytics()`
   - **Issue**: All analytics are global - no filtering by user/team
   - **Note**: Analytics include `userId` field for tracking, but queries don't filter by owner

4. **User Management**
   - **Location**: `src/lib/api.ts:getUsers()`, `updateUserRole()`
   - **Issue**: `getUsers()` returns ALL users - no team/organization scoping

#### Data Scoped by User (Per-User Data)

1. **AI Agent Config** (`ai_config` collection)
   - **Location**: `src/lib/api.ts:getAIAgentConfig()`, `saveAIAgentConfig()`
   - **Scoping**: Document ID = `user.uid` (line 452, 480)
   - **Status**: ✅ Already per-user

2. **Language Settings** (`language_settings` collection)
   - **Location**: `src/lib/api.ts:getLanguageSettings()`, `saveLanguageSettings()`
   - **Scoping**: Document ID = `user.uid` (line 1079, 1099)
   - **Status**: ✅ Already per-user

3. **User Document** (`users` collection)
   - **Location**: `src/lib/auth.ts`
   - **Scoping**: Document ID = Firebase Auth UID
   - **Status**: ✅ Per-user by design

#### Hardcoded User IDs

- **None found** - No hardcoded user IDs in the codebase
- User identification is always via `auth.currentUser` or `user.uid` from auth state

#### Global State Assuming Single User

1. **Admin Dashboard** (`src/components/AdminDashboard.tsx`)
   - **Issue**: `loadData()` fetches ALL posts, ALL segments, ALL analytics
   - **No Filtering**: No `where('userId', '==', user.uid)` or team-based queries

2. **Changelog Widget** (`src/components/ChangelogWidget.tsx`)
   - **Issue**: Shows all posts (filtered only by domain/segment, not ownership)

3. **Analytics Views**
   - **Issue**: `getAnalytics()` aggregates ALL visitor/post_view data globally
   - **No Scoping**: No filtering by team or user ownership

#### Files Where Data is Not Scoped by User

- `src/lib/api.ts`:
  - `getChangelogPosts()` - No user filter
  - `getAllChangelogPosts()` - No user filter
  - `createChangelogPost()` - No `userId` field added
  - `getSegments()` - No user filter
  - `createSegment()` - No `userId` or `teamId` field
  - `getAnalytics()` - Aggregates all data
  - `getVisitorAnalytics()` - No user/team filter
  - `getUsers()` - Returns all users
  - `getAIChatMessages()` - Filters by `eventType` only, not user/team

- `src/components/AdminDashboard.tsx`:
  - `loadData()` - Fetches all posts, segments, analytics without user scoping

- `public/widget.js` and `public/notification-widget.js`:
  - Widget scripts fetch all posts (filtered by domain only)

---

## Deployment / Vercel Notes

### Current Build Configuration

- **Build Command**: `npm run build` (defined in `netlify.toml`)
- **Output Directory**: `dist/` (Vite default)
- **Build Tool**: Vite (configured in `vite.config.ts`)

### Current Deployment Platform: Netlify

- **Config File**: `netlify.toml`
- **Edge Functions**:
  - `netlify/edge-functions/ai-proxy.ts` → `/api/ai-proxy`
  - `netlify/edge-functions/track-view.ts` → `/api/track-view`
- **Redirects**: Configured for edge function routing

### Vercel Migration Requirements

1. **No Vercel Config**: Currently no `vercel.json` file exists
2. **Edge Functions**: Netlify Edge Functions need to be converted to Vercel Edge Functions or API Routes
3. **Build Output**: Vite builds to `dist/` which is compatible with Vercel
4. **Environment Variables**: No `.env` files found, but Firebase config is hardcoded in `src/lib/firebase.ts`

### Environment Variables

- **Firebase Config**: Hardcoded in `src/lib/firebase.ts:7-15`
  - `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`, `measurementId`
  - **Action Needed**: Should be moved to environment variables for Vercel

- **No Other Env Vars**: Only `process.env.NODE_ENV` is used (in `src/App.tsx:259`)

### Build Scripts

- **Development**: `npm run dev` (Vite dev server)
- **Build**: `npm run build` (Vite production build)
- **Preview**: `npm run preview` (Preview production build locally)
- **Lint**: `npm run lint` (ESLint)

### Vercel-Specific Considerations

1. **Edge Functions**: Need to convert Netlify edge functions to Vercel Edge Functions or Next.js API routes
2. **Static Assets**: Vite builds static assets to `dist/` - compatible with Vercel
3. **Environment Variables**: Firebase config should be moved to Vercel environment variables
4. **Routing**: SPA routing should work with Vercel's rewrites (may need `vercel.json` for client-side routing)

---

## Summary of Multi-Tenant Migration Challenges

### Critical Issues for Multi-Tenancy

1. **No Team/Organization Model**: No `Team` or `Organization` entity exists
2. **Global Data Collections**: All `changelog`, `segments`, and analytics are global
3. **No Ownership Fields**: Posts and segments lack `userId` or `teamId` fields
4. **Admin Access**: All admins see all data (no team-based admin roles)
5. **User Management**: `getUsers()` returns all users globally

### Data Model Gaps

- Missing `teamId` or `organizationId` on:
  - `ChangelogPost`
  - `Segment`
  - Analytics queries
  - User documents (no team membership)

### Auth Gaps

- No team/organization selection after login
- No team membership model
- Role system (`admin`/`user`) is global, not team-scoped

### API Gaps

- All queries need `where('teamId', '==', currentTeamId)` filters
- User creation needs team assignment
- Admin role needs team scoping

