import { Team, TeamMember, User } from '../types';

/**
 * Plan configuration
 * Central source of truth for plan limits and features
 */
export const PLAN_CONFIG = {
  basic: {
    name: 'Basic',
    maxContributors: 2,
  },
  pro: {
    name: 'Pro',
    maxContributors: 10,
  },
  trial: {
    name: 'Trial',
    maxContributors: 2, // Trial has same limits as Basic
  },
  legacy: {
    name: 'Legacy',
    maxContributors: 2, // Legacy has same limits as Basic
  },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;

export interface PlanConfig {
  name: string;
  maxContributors: number;
}

/**
 * Get plan configuration for a team
 * Uses subscriptionPlan if available, otherwise falls back to plan field
 * God users always get pro plan access
 */
export function getPlan(team: Team, user?: User | null): PlanConfig {
  // God users always get pro plan access
  if (user?.role === 'god') {
    return PLAN_CONFIG.pro;
  }
  
  // Use subscriptionPlan if available, otherwise use plan field
  const planType = (team.subscriptionPlan || team.plan || 'basic') as PlanType;
  return PLAN_CONFIG[planType] || PLAN_CONFIG.basic;
}

/**
 * Count contributors in a team
 * Contributors are members with roles: owner, admin, or contributor
 * Viewers do not count toward the limit
 */
export function countContributors(members: TeamMember[]): number {
  return members.filter(
    member => 
      member.role === 'owner' || 
      member.role === 'admin' || 
      member.role === 'contributor'
  ).length;
}

/**
 * Check if a role counts as a contributor
 */
export function isContributorRole(role: TeamMember['role']): boolean {
  return role === 'owner' || role === 'admin' || role === 'contributor';
}

/**
 * Check if adding/upgrading a member would exceed contributor limit
 */
export function wouldExceedContributorLimit(
  team: Team,
  currentMembers: TeamMember[],
  newRole: TeamMember['role']
): boolean {
  const plan = getPlan(team);
  const currentContributorCount = countContributors(currentMembers);
  
  // If the new role is a viewer, it doesn't count, so no limit check needed
  if (newRole === 'viewer') {
    return false;
  }
  
  // Check if we're upgrading an existing member or adding a new one
  // For simplicity, we'll check if adding one more contributor would exceed
  // The caller should handle the case where we're upgrading an existing member
  const wouldBeContributorCount = currentContributorCount + 1;
  
  return wouldBeContributorCount > plan.maxContributors;
}

/**
 * Get error message for contributor limit exceeded
 */
export function getContributorLimitMessage(team: Team): string {
  const plan = getPlan(team);
  const planName = plan.name;
  const maxContributors = plan.maxContributors;
  
  // Check if team is on basic/trial/legacy plan (not pro)
  const currentPlan = team.subscriptionPlan || team.plan || 'basic';
  const isBasicPlan = currentPlan === 'basic' || currentPlan === 'trial' || currentPlan === 'legacy';
  
  if (isBasicPlan) {
    return `${planName} plan allows ${maxContributors} contributor${maxContributors !== 1 ? 's' : ''}. You have reached the limit. Upgrade to Pro to add more contributors.`;
  }
  
  return `${planName} plan allows ${maxContributors} contributor${maxContributors !== 1 ? 's' : ''}. You have reached the limit.`;
}

