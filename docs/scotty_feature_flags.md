# Scotty Feature Flags

## Overview

Scotty uses a flexible feature flag system that allows features to be enabled or disabled based on subscription plans, with the ability to override features per team for testing or special cases.

## Feature Keys

The following features are defined in the system:

- **`advanced_ai`** - Advanced AI features and configurations
- **`admin_analytics`** - Detailed analytics and reporting for administrators
- **`multi_language`** - Support for multiple languages and translations
- **`advanced_segments`** - Advanced segment management and targeting
- **`export_automation`** - Automated export and data processing
- **`priority_support`** - Priority customer support and faster response times

## Plan Configuration

Features are assigned to plans in `src/lib/features.ts`:

```typescript
export const PLAN_FEATURES: Record<string, FeatureKey[]> = {
  basic: [
    'multi_language', // Basic language support
  ],
  pro: [
    'advanced_ai',
    'admin_analytics',
    'multi_language',
    'advanced_segments',
    'export_automation',
    'priority_support',
  ],
  trial: [
    'multi_language', // Same as basic
  ],
  legacy: [
    'multi_language', // Same as basic
  ],
};
```

## Feature Overrides

Feature overrides allow you to grant or revoke features for specific teams, independent of their plan. This is useful for:

- Granting pro features to basic teams for pilot programs
- Temporarily disabling features for specific teams
- Testing new features with select teams

### Database Structure

Overrides are stored in the `team_feature_overrides` collection:

- `id` - Document ID
- `teamId` - Team the override applies to
- `featureKey` - Feature key (e.g., "admin_analytics")
- `enabled` - Whether the feature is enabled (true/false)
- `createdAt` - When the override was created
- `updatedAt` - When the override was last updated

## Helper Functions

### `isFeatureEnabledForTeam(team, overrides, featureKey)`

Checks if a feature is enabled for a team, considering both plan features and overrides.

**Logic:**
1. Get base features from team's plan (uses `subscriptionPlan` if available, otherwise `plan`)
2. Check if there's an override for the feature
3. If override exists, return its `enabled` value
4. Otherwise, return whether the feature is in the plan's feature list

**Example:**
```typescript
import { isFeatureEnabledForTeam } from '../lib/features';
import { featureOverrideService } from '../lib/feature-overrides';

const team = await teamService.getTeam(teamId);
const overrides = await featureOverrideService.getTeamOverrides(teamId);
const hasAnalytics = isFeatureEnabledForTeam(team, overrides, 'admin_analytics');
```

### `getEnabledFeaturesForTeam(team, overrides)`

Returns an array of all enabled feature keys for a team.

**Example:**
```typescript
import { getEnabledFeaturesForTeam } from '../lib/features';

const enabledFeatures = getEnabledFeaturesForTeam(team, overrides);
// Returns: ['multi_language', 'admin_analytics', ...]
```

## Backend Gating

Backend routes should check feature availability before allowing access to protected functionality.

**Example:**
```typescript
// In api.ts
async getVisitorAnalytics(teamId?: string): Promise<any> {
  const currentTeamId = teamId || getCurrentTeamId();
  const team = await teamService.getTeam(currentTeamId);
  const overrides = await featureOverrideService.getTeamOverrides(currentTeamId);
  
  if (!isFeatureEnabledForTeam(team, overrides, 'admin_analytics')) {
    throw new Error('This feature is not available on your current plan. Upgrade to Pro to access admin analytics.');
  }
  
  // ... rest of implementation
}
```

## Frontend Usage

### Checking Features

```typescript
import { isFeatureEnabledForTeam } from '../lib/features';
import { featureOverrideService } from '../lib/feature-overrides';
import { useTeam } from '../hooks/useTeam';

const { currentTeam } = useTeam();
const [overrides, setOverrides] = useState([]);

useEffect(() => {
  if (currentTeam) {
    featureOverrideService.getTeamOverrides(currentTeam.id).then(setOverrides);
  }
}, [currentTeam]);

const hasFeature = isFeatureEnabledForTeam(currentTeam, overrides, 'admin_analytics');
```

### Showing Upgrade Prompts

When a feature is not available, show an upgrade prompt:

```typescript
{!hasFeature && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <p className="text-sm text-yellow-800">
      This feature is available on the Pro plan.
    </p>
    <Button onClick={handleUpgrade}>Upgrade to Pro</Button>
  </div>
)}
```

## Feature Flags UI

The Feature Flags UI is available in Team Settings for team owners and admins. It's hidden by default and can be enabled with the environment variable:

```
VITE_ENABLE_FEATURE_FLAGS=true
```

**To enable:**
1. Set `VITE_ENABLE_FEATURE_FLAGS=true` in your environment
2. Open Team Settings
3. Click "Show" next to "Feature Flags"
4. Toggle features on/off for the team

## Adding New Features

1. Add the feature key to the `FeatureKey` type in `src/lib/features.ts`
2. Add it to the appropriate plan(s) in `PLAN_FEATURES`
3. Add display name and description in `getFeatureDisplayName()` and `getFeatureDescription()`
4. Add backend gating where the feature is used
5. Add frontend checks and upgrade prompts in relevant components

## Best Practices

1. **Always gate on backend** - Frontend checks are for UX only; backend must enforce
2. **Clear error messages** - Tell users which plan they need to upgrade to
3. **Graceful degradation** - Hide or disable features rather than breaking the UI
4. **Use overrides sparingly** - Only for testing or special cases
5. **Document feature availability** - Keep this doc updated when adding features

## Current Feature Gating

- **`admin_analytics`** - Gated in:
  - `getVisitorAnalytics()` - Returns error if not enabled
  - `getPostAnalytics()` - Returns error if not enabled
  - AdminDashboard - Shows upgrade prompt instead of analytics
  - PostAnalyticsModal - Shows error message if not enabled

## Troubleshooting

### Feature not working after upgrade

1. Check team's `subscriptionPlan` field is set correctly
2. Verify feature is in `PLAN_FEATURES` for the plan
3. Check for overrides that might be disabling the feature
4. Refresh the page to reload feature state

### Override not taking effect

1. Verify override exists in `team_feature_overrides` collection
2. Check `teamId` matches the current team
3. Ensure `featureKey` matches exactly (case-sensitive)
4. Reload feature overrides in the component

