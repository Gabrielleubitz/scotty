# Roles and Permissions

## Team Member Roles

Scotty uses a team-based role system. Each user has a role **per team**, so a user can have different roles in different teams.

### 1. **Owner** 👑
**Highest level of access**

**Permissions:**
- ✅ Full control over the team
- ✅ Can manage team settings (rename, billing, etc.)
- ✅ Can add/remove team members
- ✅ Can change member roles
- ✅ Can delete the team
- ✅ Can create, edit, and delete posts
- ✅ Can manage API keys
- ✅ Can manage feature flags
- ✅ Cannot be removed from the team
- ✅ Cannot have their role changed

**Contributor Limit:** ✅ Counts toward contributor limit

**Who gets it:**
- User who creates the team (automatically assigned)
- Only one owner per team

---

### 2. **Admin** 🛡️
**Management access**

**Permissions:**
- ✅ Can manage team settings (rename, billing, etc.)
- ✅ Can add/remove team members
- ✅ Can change member roles (except owner)
- ✅ Can create, edit, and delete posts
- ✅ Can manage API keys
- ✅ Can manage feature flags
- ✅ Can view analytics
- ❌ Cannot delete the team
- ❌ Cannot remove or change owner role

**Contributor Limit:** ✅ Counts toward contributor limit

**Use case:**
- Team leads who need to manage the team but aren't the original creator
- Can be promoted from contributor or assigned when invited

---

### 3. **Contributor** ✏️
**Content creation access**

**Permissions:**
- ✅ Can create and edit changelog posts
- ✅ Can create and edit segments
- ✅ Can view analytics
- ✅ Can view team members
- ❌ Cannot manage team settings
- ❌ Cannot add/remove team members
- ❌ Cannot manage API keys
- ❌ Cannot delete posts (only edit)
- ❌ Cannot manage feature flags

**Contributor Limit:** ✅ Counts toward contributor limit

**Use case:**
- Content creators and writers
- Product managers who need to publish updates
- Most common role for team members

---

### 4. **Viewer** 👁️
**Read-only access**

**Permissions:**
- ✅ Can view changelog posts
- ✅ Can view analytics
- ✅ Can view team members
- ❌ Cannot create or edit posts
- ❌ Cannot manage anything
- ❌ Cannot access team settings

**Contributor Limit:** ❌ Does NOT count toward contributor limit

**Use case:**
- Stakeholders who need visibility
- External team members who just need to see updates
- Free way to give access without using contributor slots

---

## Legacy User Roles

There's also a legacy `User` role system (stored in the `users` collection):

- **`admin`** - Legacy admin role (not used for permissions anymore)
- **`user`** - Legacy user role (not used for permissions anymore)

**Note:** These are legacy fields. Actual permissions come from `TeamMember` roles, not `User.role`.

---

## Role Hierarchy

```
Owner (highest)
  ↓
Admin
  ↓
Contributor
  ↓
Viewer (lowest)
```

## Contributor Limits

Only these roles count toward plan limits:
- ✅ **Owner**
- ✅ **Admin**
- ✅ **Contributor**

**Viewer** does NOT count toward limits, so you can have unlimited viewers.

### Plan Limits:
- **Basic/Trial**: 2 contributors max
- **Pro**: 10 contributors max

---

## Role Assignment

### On Team Creation
- Team creator automatically becomes **Owner**

### When Inviting Members
- Default role: **Contributor**
- Can choose: Admin, Contributor, or Viewer
- Cannot assign Owner role (only team creator has it)

### Role Changes
- **Owner** → Can promote anyone to Admin
- **Admin** → Can promote Contributors to Admin, or demote Admins to Contributor
- **Owner/Admin** → Can change Contributors to Viewers (frees up contributor slot)
- **Owner/Admin** → Cannot change Owner role
- **Owner/Admin** → Cannot remove Owner

---

## Permission Matrix

| Action | Owner | Admin | Contributor | Viewer |
|--------|-------|-------|-------------|--------|
| View posts | ✅ | ✅ | ✅ | ✅ |
| Create posts | ✅ | ✅ | ✅ | ❌ |
| Edit posts | ✅ | ✅ | ✅ | ❌ |
| Delete posts | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| Manage team settings | ✅ | ✅ | ❌ | ❌ |
| Add/remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ | ❌ | ❌ |
| Manage API keys | ✅ | ✅ | ❌ | ❌ |
| Manage feature flags | ✅ | ✅ | ❌ | ❌ |
| Delete team | ✅ | ❌ | ❌ | ❌ |
| Remove owner | ❌ | ❌ | ❌ | ❌ |

---

## Best Practices

1. **Use Viewers for stakeholders** - They don't count toward limits
2. **Keep Owner count low** - Usually just 1-2 owners per team
3. **Use Admins for team leads** - They can manage without full ownership
4. **Contributors for content creators** - Most team members should be contributors
5. **Demote to Viewer** - If you hit contributor limits, demote inactive members to viewer

---

## Code References

- **Type Definition**: `src/types/index.ts` - `TeamMember.role`
- **Permission Checks**: `src/lib/teams.ts` - `userCanManageTeam()`
- **Contributor Counting**: `src/lib/plans.ts` - `countContributors()`
- **Role Validation**: `src/lib/plans.ts` - `isContributorRole()`

