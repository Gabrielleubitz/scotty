export interface ChangelogPost {
  id: string;
  title: string;
  content: string;
  translations?: {
    [languageCode: string]: {
      title: string;
      content: string;
      isAIGenerated?: boolean;
    };
  };
  videoUrl?: string;
  imageUrl?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  views: number;
  publishedAt?: Date;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published';
  segmentId?: string;
  teamId: string; // Multi-tenant: scoped to team
}

export interface User {
  id: string;
  email: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
  avatar?: string; // Legacy field, use avatarUrl
  role: 'admin' | 'user'; // Legacy role, use team memberships for actual permissions
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  plan: 'basic' | 'pro' | 'trial' | 'legacy';
  // Billing fields
  billingCustomerId?: string | null;
  subscriptionStatus?: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trial';
  subscriptionPlan?: 'basic' | 'pro' | null;
  subscriptionRenewsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'contributor' | 'viewer';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  sessionId?: string;
}

export interface Analytics {
  totalViews: number;
  uniqueUsers: number;
  viewsOverTime: Array<{
    date: string;
    views: number;
  }>;
}

export interface AIAgentConfig {
  apiToken: string;
  apiUrl: string;
  enabled: boolean;
}

export interface LanguageSettings {
  supportedLanguages: string[];
  defaultLanguage: string;
  enabledLanguages: string[];
  translationService: 'openai' | 'google' | 'deepl';
  translationApiKey?: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface ChatResponse {
  session_id: string;
  type: 'chat' | 'function';
  message?: string;
  function_name?: string;
  arguments?: Record<string, any>;
}

export interface Segment {
  id: string;
  name: string;
  domain: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  teamId: string; // Multi-tenant: scoped to team
}

export interface TeamFeatureOverride {
  id: string;
  teamId: string;
  featureKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIKey {
  id: string;
  teamId: string;
  name: string;
  keyHash: string; // Never store plain key
  createdAt: Date;
  lastUsedAt?: Date | null;
  isRevoked: boolean;
}