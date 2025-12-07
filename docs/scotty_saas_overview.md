# Scotty SaaS Overview

## Introduction

Scotty is a multi-tenant, team-based SaaS platform for managing product changelogs and updates. This document provides an overview of the SaaS architecture, plans, billing, and feature system.

## Architecture

### Multi-Tenant Model

Scotty uses a team-based multi-tenant architecture:

- **Teams**: Each team is an isolated workspace with its own data
- **Team Members**: Users can belong to multiple teams with different roles
- **Data Scoping**: All data (posts, segments, analytics) is scoped to teams
- **Team Context**: Users select a current team, and all operations are performed in that context

### Data Model

#### Teams
- Each team has a unique ID and slug
- Teams have an owner (user who created the team)
- Teams can have multiple members with different roles

#### Team Members
- **Owner**: Full control, cannot be removed
- **Admin**: Can manage team settings, members, and content
- **Contributor**: Can create and edit content
- **Viewer**: Read-only access

#### Data Isolation
- All changelog posts are scoped by `teamId`
- All segments are scoped by `teamId`
- Analytics are filtered by team's posts
- API keys are team-scoped

## Subscription Plans

### Basic Plan
- **Price**: See Stripe pricing
- **Contributors**: Up to 2 contributors (owner, admin, or contributor roles)
- **Features**:
  - Multi-language support
  - Basic changelog management
  - Standard support

### Pro Plan
- **Price**: See Stripe pricing
- **Contributors**: Up to 10 contributors
- **Features**:
  - All Basic features
  - Advanced AI features
  - Admin analytics
  - Advanced segments
  - Export automation
  - Priority support

### Trial
- New teams start with a trial period
- Same limits as Basic plan
- Automatically converts to Basic after trial (if billing is configured)

## Contributor Limits

Contributors are team members with roles: **owner**, **admin**, or **contributor**.

**Viewers do NOT count toward the limit.**

### Enforcement
- When inviting a new member as a contributor role
- When upgrading a viewer to a contributor role
- System blocks the action if limit would be exceeded
- Clear error message with upgrade prompt

### Example
- Basic plan allows 2 contributors
- Team has: 1 owner + 1 admin = 2 contributors (limit reached)
- Trying to add another contributor → Blocked with upgrade message

## Feature Flags

Scotty uses a flexible feature flag system to control feature availability.

### Plan-Based Features
Features are assigned to plans in `src/lib/features.ts`:
- Basic plan has a subset of features
- Pro plan includes all features
- Features can be enabled/disabled per plan

### Feature Overrides
Teams can have feature overrides that grant or revoke features independently of their plan:
- Useful for pilot programs
- Testing new features
- Special arrangements

### Current Features
- `advanced_ai` - Advanced AI features and configurations
- `admin_analytics` - Detailed analytics and reporting
- `multi_language` - Multi-language support
- `advanced_segments` - Advanced segment management
- `export_automation` - Automated export and processing
- `priority_support` - Priority customer support

See [Feature Flags Documentation](./scotty_feature_flags.md) for details.

## Billing

### Stripe Integration
- Stripe handles subscription management
- Teams can upgrade/downgrade plans
- Automatic billing and renewals

### Subscription States
- `active` - Subscription is active and paid
- `trial` - Trial period (new teams)
- `inactive` - No active subscription
- `past_due` - Payment failed, retrying
- `canceled` - Subscription canceled

### Team Billing Fields
- `billingCustomerId` - Stripe customer ID
- `subscriptionStatus` - Current subscription status
- `subscriptionPlan` - Active plan (basic/pro)
- `subscriptionRenewsAt` - Next renewal date

### Upgrade Flow
1. User clicks "Upgrade to Pro" in Team Settings
2. Redirected to Stripe Checkout
3. After payment, webhook updates team subscription
4. Features become available immediately

## API Access

Teams can create API keys for programmatic access:

### API Key Management
- Create named API keys in Team Settings
- Keys are team-scoped
- Can revoke keys at any time
- Track last used timestamp

### External API
- RESTful API for external systems
- Team-scoped data access
- Feature flag enforcement
- Rate limiting (future)

See [API Documentation](./scotty_api_overview.md) for details.

## Team Management

### Creating Teams
- New users automatically get a default team
- Team name: "{User's Name}'s Team"
- Team slug auto-generated from name
- User becomes team owner

### Team Settings
Accessible to owners and admins:
- Rename team
- View/manage members
- Invite members
- Manage API keys
- View billing and upgrade
- Feature flag overrides (when enabled)

### Member Management
- Invite by email (creates membership if user exists)
- Assign roles (owner/admin/contributor/viewer)
- Remove members (except owner)
- Enforce contributor limits

## Data Migration

For existing single-user installations:

1. Run migration script: `migrateDataToTeams()`
2. Creates default team for each user
3. Assigns all user's data to their team
4. Preserves all existing data

## Security

### Authentication
- Firebase Authentication
- Email/password and Google OAuth
- Session-based authentication

### Authorization
- Team membership required for access
- Role-based permissions
- API key authentication for external access

### Data Protection
- All queries filtered by teamId
- API keys are hashed (never stored plain)
- Team-scoped API access
- Feature flag enforcement

## Deployment

### Vercel Configuration
- Build command: `npm run build`
- Output directory: `dist/`
- Serverless functions in `api/` directory
- Environment variables configured in Vercel dashboard

### Environment Variables

**Client-side (VITE_ prefix):**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_ENABLE_FEATURE_FLAGS` (optional)

**Server-side (no prefix):**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase Admin service account JSON
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `STRIPE_PRICE_BASIC` - Stripe price ID for Basic plan
- `STRIPE_PRICE_PRO` - Stripe price ID for Pro plan

### Build Process
1. Install dependencies: `npm install`
2. Build: `npm run build`
3. Output: `dist/` directory
4. Deploy to Vercel

## Best Practices

### For Team Owners
- Keep contributor count within plan limits
- Regularly review and revoke unused API keys
- Monitor subscription status
- Use feature flags for testing (when enabled)

### For Developers
- Always scope queries by teamId
- Check feature flags before enabling features
- Use API keys for external integrations
- Handle missing env vars gracefully

### For API Users
- Store API keys securely
- Use appropriate HTTP methods
- Handle errors gracefully
- Respect rate limits (when implemented)

## Troubleshooting

### Team has no data
- Check team context is selected
- Verify teamId is set on documents
- Check user has access to team

### Contributor limit issues
- Verify current contributor count
- Check team's plan
- Upgrade to Pro if needed

### API key not working
- Verify key is not revoked
- Check Authorization header format
- Ensure key belongs to correct team

### Feature not available
- Check team's plan
- Verify feature is enabled for plan
- Check for feature overrides
- Upgrade plan if needed

## Future Enhancements

- [ ] Team creation UI (currently only default team)
- [ ] Email-based invite system
- [ ] Team deletion with data cleanup
- [ ] Advanced rate limiting
- [ ] Webhook support for API
- [ ] More API endpoints
- [ ] API versioning
- [ ] Team activity logs

