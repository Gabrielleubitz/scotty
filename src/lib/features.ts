import { Team, User } from '../types';

/**
 * Feature keys that can be enabled/disabled per plan
 */
export type FeatureKey =
  | 'advanced_ai'
  | 'admin_analytics'
  | 'multi_language'
  | 'advanced_segments'
  | 'export_automation'
  | 'priority_support';

/**
 * Plan-based feature configuration
 * Defines which features are available for each plan
 */
export const PLAN_FEATURES: Record<string, FeatureKey[]> = {
  basic: [
    // Basic plan features
    'multi_language', // Basic language support
  ],
  pro: [
    // Pro plan includes all features
    'advanced_ai',
    'admin_analytics',
    'multi_language',
    'advanced_segments',
    'export_automation',
    'priority_support',
  ],
  trial: [
    // Trial has same features as basic
    'multi_language',
  ],
  legacy: [
    // Legacy has same features as basic
    'multi_language',
  ],
} as const;

/**
 * Feature override for a team
 * Allows granting or revoking features per team
 */
export interface TeamFeatureOverride {
  id: string;
  teamId: string;
  featureKey: FeatureKey;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if a feature is enabled for a team
 * 
 * Logic:
 * 1. God users always have all features enabled
 * 2. Get base features from team's plan
 * 3. Apply any overrides for that team
 * 4. Return whether the feature is enabled
 * 
 * @param team - The team to check
 * @param overrides - Array of feature overrides for the team
 * @param featureKey - The feature to check
 * @param user - Optional user to check for god role
 * @returns true if the feature is enabled, false otherwise
 */
export function isFeatureEnabledForTeam(
  team: Team,
  overrides: TeamFeatureOverride[],
  featureKey: FeatureKey,
  user?: User | null
): boolean {
  // God users always have all features enabled
  if (user?.role === 'god') {
    return true;
  }
  
  // Get the team's plan (use subscriptionPlan if available, otherwise plan)
  const planType = (team.subscriptionPlan || team.plan || 'basic') as keyof typeof PLAN_FEATURES;
  
  // Get base features for the plan
  const planFeatures = PLAN_FEATURES[planType] || PLAN_FEATURES.basic;
  
  // Check if there's an override for this feature
  const override = overrides.find(o => o.featureKey === featureKey);
  
  if (override !== undefined) {
    // Override exists, use its enabled value
    return override.enabled;
  }
  
  // No override, check if feature is in plan's feature list
  return planFeatures.includes(featureKey);
}

/**
 * Get all enabled features for a team
 * 
 * @param team - The team to check
 * @param overrides - Array of feature overrides for the team
 * @returns Array of enabled feature keys
 */
export function getEnabledFeaturesForTeam(
  team: Team,
  overrides: TeamFeatureOverride[]
): FeatureKey[] {
  // Get the team's plan
  const planType = (team.subscriptionPlan || team.plan || 'basic') as keyof typeof PLAN_FEATURES;
  
  // Get base features for the plan
  const planFeatures = PLAN_FEATURES[planType] || PLAN_FEATURES.basic;
  
  // Start with plan features
  const enabledFeatures = new Set<FeatureKey>(planFeatures);
  
  // Apply overrides
  for (const override of overrides) {
    if (override.enabled) {
      enabledFeatures.add(override.featureKey);
    } else {
      enabledFeatures.delete(override.featureKey);
    }
  }
  
  return Array.from(enabledFeatures);
}

/**
 * Get feature display name
 */
export function getFeatureDisplayName(featureKey: FeatureKey): string {
  const names: Record<FeatureKey, string> = {
    advanced_ai: 'Advanced AI',
    admin_analytics: 'Admin Analytics',
    multi_language: 'Multi-Language Support',
    advanced_segments: 'Advanced Segments',
    export_automation: 'Export Automation',
    priority_support: 'Priority Support',
  };
  return names[featureKey] || featureKey;
}

/**
 * Get feature description
 */
export function getFeatureDescription(featureKey: FeatureKey): string {
  const descriptions: Record<FeatureKey, string> = {
    advanced_ai: 'Access to advanced AI features and configurations',
    admin_analytics: 'Detailed analytics and reporting for administrators',
    multi_language: 'Support for multiple languages and translations',
    advanced_segments: 'Advanced segment management and targeting',
    export_automation: 'Automated export and data processing',
    priority_support: 'Priority customer support and faster response times',
  };
  return descriptions[featureKey] || '';
}

