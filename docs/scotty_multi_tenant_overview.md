# Scotty Multi-Tenant Overview

## Overview

Scotty has been converted from a single-user application to a team-based, multi-tenant SaaS platform. All data is now scoped to teams, and users can belong to multiple teams with different roles.

## Architecture

### Data Model

#### Teams
- **Collection**: `teams`
- **Fields**:
  - `id`: string (document ID)
  - `name`: string
  - `slug`: string (URL-friendly identifier)
  - `ownerUserId`: string (user who owns the team)
  - `plan`: 'basic' | 'pro' | 'trial' | 'legacy'
  - `createdAt`: Date
  - `updatedAt`: Date

#### Team Members
- **Collection**: `team_members`
- **Fields**:
  - `id`: string (document ID)
  - `teamId`: string
  - `userId`: string
  - `role`: 'owner' | 'admin' | 'contributor' | 'viewer'
  - `createdAt`: Date

#### Users
- **Collection**: `users`
- **Updated Fields**:
  - `displayName`: string (preferred over `name`)
  - `avatarUrl`: string (preferred over `avatar`)
  - `createdAt`: Date
  - `updatedAt`: Date
  - `role`: 'admin' | 'user' (legacy field, actual permissions come from team memberships)

### Team Scoping

All core entities now include a `teamId` field:
- **ChangelogPost**: `teamId` required
- **Segment**: `teamId` required
- **Analytics**: Filtered by team's posts

### Team Context

The application uses a team context system:
- **Hook**: `useTeam()` - Provides current team, user teams, role, and team management functions
- **Storage**: Current team ID stored in `localStorage` as `currentTeamId`
- **UI**: Team switcher in header allows switching between teams

## Features

### Team Management

1. **Team Creation**
   - New users automatically get a default team on signup
   - Team name defaults to "{User's Name}'s Team"
   - Team slug is auto-generated from name

2. **Team Settings**
   - Accessible via "Team Settings" button in header
   - View/edit team name and slug
   - View team members and roles
   - Invite members by email (creates membership if user exists)
   - Manage member roles (owner/admin only)
   - Remove members (owner/admin only)

3. **Team Switcher**
   - Dropdown in header shows all user's teams
   - Current team is highlighted
   - Click to switch teams
   - Team context persists across page reloads

### Access Control

#### Roles

- **Owner**: Full control, cannot be removed
- **Admin**: Can manage team settings, members, and all content
- **Contributor**: Can create and edit content
- **Viewer**: Read-only access

#### Permissions

- **Team Settings**: Owner and Admin only
- **Invite/Remove Members**: Owner and Admin only
- **Change Member Roles**: Owner and Admin only (cannot change owner role)
- **Content Management**: Based on role (contributors and above can create/edit)

### Data Migration

A migration utility is available to assign existing data to teams:
- **Location**: `src/lib/migration.ts`
- **Function**: `migrateDataToTeams()`
- **Process**:
  1. Creates default team for each existing user
  2. Assigns all user's posts to their team
  3. Assigns all user's segments to their team

To run migration:
```typescript
import { runMigration } from './lib/migration';
// Call from browser console or admin panel
runMigration();
```

## API Changes

All API methods now accept an optional `teamId` parameter. If not provided, the current team from context is used.

### Updated Methods

- `getChangelogPosts(teamId?: string)`
- `getAllChangelogPosts(teamId?: string)`
- `createChangelogPost(post, teamId?: string)`
- `updateChangelogPost(id, updates, teamId?: string)`
- `deleteChangelogPost(id, teamId?: string)`
- `getSegments(teamId?: string)`
- `createSegment(segment, teamId?: string)`
- `updateSegment(id, updates, teamId?: string)`
- `deleteSegment(id, teamId?: string)`
- `getAnalytics(teamId?: string)`
- `getVisitorAnalytics(teamId?: string)`

## Components

### Team-Related Components

1. **TeamSwitcher** (`src/components/TeamSwitcher.tsx`)
   - Dropdown to switch between teams
   - Shows current team name
   - Lists all user teams

2. **TeamSettings** (`src/components/TeamSettings.tsx`)
   - Modal for team management
   - Edit team name
   - View/manage members
   - Invite new members

3. **useTeam Hook** (`src/hooks/useTeam.ts`)
   - Manages team context
   - Provides current team, user teams, role
   - Handles team switching
   - Auto-creates default team if needed

## Running Locally

### Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Update `src/lib/firebase.ts` with your Firebase config
   - Ensure Firestore and Authentication are enabled

3. Run migration (if you have existing data):
   - Open browser console
   - Run: `runMigration()` (import from `src/lib/migration.ts`)

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Migration Notes

### For Existing Users

1. On first login after update, a default team is automatically created
2. Existing data should be migrated using the migration utility
3. Users can create additional teams via the team switcher (coming soon)

### For New Users

1. Sign up creates a user account
2. Default team is automatically created
3. User is set as team owner
4. All new content is automatically scoped to the current team

## Future Enhancements

- [ ] Team creation UI (currently only default team on signup)
- [ ] Email-based invite system
- [ ] Team deletion with data cleanup
- [ ] Team-level billing integration
- [ ] Team-level feature flags based on plan
- [ ] Team activity logs
- [ ] Team templates

## Technical Notes

### Team Context Storage

- Current team ID stored in `localStorage.getItem('currentTeamId')`
- Persists across page reloads
- Can be extended to use URL routing (e.g., `/t/[teamSlug]/...`)

### Query Filtering

All Firestore queries now include team filtering:
```typescript
const q = query(
  collection(db, 'changelog'),
  where('teamId', '==', currentTeamId),
  orderBy('createdAt', 'desc')
);
```

### Access Control

Team access is verified before operations:
- `teamService.userHasAccessToTeam(userId, teamId)` - Checks membership
- `teamService.userCanManageTeam(userId, teamId)` - Checks admin/owner role

## Troubleshooting

### User has no team

- Check if user document exists in Firestore
- Verify team creation on signup completed
- Manually create team: `teamService.getOrCreateDefaultTeam(userId, userName)`

### Data not showing

- Verify `teamId` is set on documents
- Check current team context: `localStorage.getItem('currentTeamId')`
- Verify user has access to team: `teamService.userHasAccessToTeam(userId, teamId)`

### Team switching not working

- Check browser console for errors
- Verify team exists: `teamService.getTeam(teamId)`
- Check user membership: `teamService.getUserTeamRole(userId, teamId)`
