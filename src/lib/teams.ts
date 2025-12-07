import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Team, TeamMember, User } from '../types';
import { FirestoreRetryUtil } from './firestore-utils';
import { countContributors, wouldExceedContributorLimit, getContributorLimitMessage } from './plans';

/**
 * Generate a URL-friendly slug from a team name
 */
export function generateTeamSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if a slug is available
 */
export async function isSlugAvailable(slug: string, excludeTeamId?: string): Promise<boolean> {
  try {
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return true;
    
    // If excluding a team, check if the only match is that team
    if (excludeTeamId) {
      const matches = querySnapshot.docs.filter(doc => doc.id !== excludeTeamId);
      return matches.length === 0;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(name: string, excludeTeamId?: string): Promise<string> {
  let baseSlug = generateTeamSlug(name);
  let slug = baseSlug;
  let counter = 1;
  
  while (!(await isSlugAvailable(slug, excludeTeamId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

class TeamService {
  /**
   * Create a new team
   * Defaults to "basic" plan with "trial" subscription status
   */
  async createTeam(name: string, ownerUserId: string, plan: 'basic' | 'pro' | 'trial' | 'legacy' = 'basic'): Promise<Team> {
    const slug = await generateUniqueSlug(name);
    const now = new Date();
    
    const team = await FirestoreRetryUtil.withRetry(async () => {
      const docRef = await addDoc(collection(db, 'teams'), {
        name,
        slug,
        ownerUserId,
        plan: plan === 'trial' ? 'basic' : plan, // Store plan as basic/pro/legacy, use subscriptionStatus for trial
        subscriptionStatus: plan === 'trial' ? 'trial' : 'inactive',
        subscriptionPlan: plan === 'trial' ? 'basic' : (plan === 'pro' ? 'pro' : null),
        billingCustomerId: null,
        subscriptionRenewsAt: null,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });
      
      // Create owner membership
      await addDoc(collection(db, 'team_members'), {
        teamId: docRef.id,
        userId: ownerUserId,
        role: 'owner',
        createdAt: Timestamp.fromDate(now),
      });
      
      return {
        id: docRef.id,
        name,
        slug,
        ownerUserId,
        plan: plan === 'trial' ? 'basic' : plan,
        subscriptionStatus: plan === 'trial' ? 'trial' : 'inactive',
        subscriptionPlan: plan === 'trial' ? 'basic' : (plan === 'pro' ? 'pro' : null),
        billingCustomerId: null,
        subscriptionRenewsAt: null,
        createdAt: now,
        updatedAt: now,
      };
    });
    
    return team;
  }

  /**
   * Get a team by ID
   */
  async getTeam(teamId: string): Promise<Team | null> {
    try {
      const teamDoc = await getDoc(doc(db, 'teams', teamId));
      if (!teamDoc.exists()) return null;
      
      const data = teamDoc.data();
      return {
        id: teamDoc.id,
        name: data.name,
        slug: data.slug,
        ownerUserId: data.ownerUserId,
        plan: data.plan || 'basic',
        billingCustomerId: data.billingCustomerId || null,
        subscriptionStatus: data.subscriptionStatus || 'inactive',
        subscriptionPlan: data.subscriptionPlan || null,
        subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting team:', error);
      return null;
    }
  }

  /**
   * Get a team by slug
   */
  async getTeamBySlug(slug: string): Promise<Team | null> {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, where('slug', '==', slug));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      const teamDoc = querySnapshot.docs[0];
      const data = teamDoc.data();
      return {
        id: teamDoc.id,
        name: data.name,
        slug: data.slug,
        ownerUserId: data.ownerUserId,
        plan: data.plan || 'basic',
        billingCustomerId: data.billingCustomerId || null,
        subscriptionStatus: data.subscriptionStatus || 'inactive',
        subscriptionPlan: data.subscriptionPlan || null,
        subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting team by slug:', error);
      return null;
    }
  }

  /**
   * Get all teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      const membershipsRef = collection(db, 'team_members');
      const q = query(membershipsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const teamIds = querySnapshot.docs.map(doc => doc.data().teamId);
      if (teamIds.length === 0) return [];
      
      const teams: Team[] = [];
      for (const teamId of teamIds) {
        const team = await this.getTeam(teamId);
        if (team) teams.push(team);
      }
      
      return teams;
    } catch (error) {
      console.error('Error getting user teams:', error);
      return [];
    }
  }

  /**
   * Update a team
   */
  async updateTeam(teamId: string, updates: Partial<Pick<Team, 'name' | 'slug'>>): Promise<Team> {
    return await FirestoreRetryUtil.withRetry(async () => {
      const teamRef = doc(db, 'teams', teamId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };
      
      // If name is updated, regenerate slug if needed
      if (updates.name && !updates.slug) {
        updateData.slug = await generateUniqueSlug(updates.name, teamId);
      } else if (updates.slug) {
        // Validate slug is available
        const available = await isSlugAvailable(updates.slug, teamId);
        if (!available) {
          throw new Error('Slug is already taken');
        }
      }
      
      await updateDoc(teamRef, updateData);
      
      const updatedDoc = await getDoc(teamRef);
      const data = updatedDoc.data()!;
      return {
        id: teamId,
        name: data.name,
        slug: data.slug,
        ownerUserId: data.ownerUserId,
        plan: data.plan || 'basic',
        billingCustomerId: data.billingCustomerId || null,
        subscriptionStatus: data.subscriptionStatus || 'inactive',
        subscriptionPlan: data.subscriptionPlan || null,
        subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  }

  /**
   * Delete a team (and all its data)
   */
  async deleteTeam(teamId: string): Promise<void> {
    // Note: In production, you'd want to handle cascading deletes more carefully
    // For now, we'll just delete the team document
    await FirestoreRetryUtil.withRetry(async () => {
      await deleteDoc(doc(db, 'teams', teamId));
    });
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string): Promise<(TeamMember & { user?: User })[]> {
    try {
      const membershipsRef = collection(db, 'team_members');
      const q = query(membershipsRef, where('teamId', '==', teamId));
      const querySnapshot = await getDocs(q);
      
      const members: (TeamMember & { user?: User })[] = [];
      
      for (const memberDoc of querySnapshot.docs) {
        const data = memberDoc.data();
        const userId = data.userId;
        
        // Fetch user data
        let user: User | undefined;
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            user = {
              id: userId,
              email: userData.email,
              name: userData.name || userData.displayName || 'User',
              avatar: userData.avatar || userData.avatarUrl,
              role: userData.role || 'user',
              displayName: userData.displayName || userData.name,
              avatarUrl: userData.avatarUrl || userData.avatar,
            };
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error);
        }
        
        members.push({
          id: memberDoc.id,
          teamId: data.teamId,
          userId: data.userId,
          role: data.role,
          createdAt: data.createdAt?.toDate() || new Date(),
          user,
        });
      }
      
      return members;
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  /**
   * Get user's role in a team
   */
  async getUserTeamRole(userId: string, teamId: string): Promise<TeamMember['role'] | null> {
    try {
      const membershipsRef = collection(db, 'team_members');
      const q = query(
        membershipsRef,
        where('teamId', '==', teamId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      return querySnapshot.docs[0].data().role as TeamMember['role'];
    } catch (error) {
      console.error('Error getting user team role:', error);
      return null;
    }
  }

  /**
   * Add a member to a team
   * Enforces contributor limits based on team plan
   */
  async addTeamMember(teamId: string, userId: string, role: TeamMember['role'] = 'contributor'): Promise<TeamMember> {
    // Check if user already has a membership
    const existingRole = await this.getUserTeamRole(userId, teamId);
    if (existingRole) {
      throw new Error('User is already a member of this team');
    }
    
    // Check contributor limits
    const team = await this.getTeam(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    const currentMembers = await this.getTeamMembers(teamId);
    if (wouldExceedContributorLimit(team, currentMembers, role)) {
      throw new Error(getContributorLimitMessage(team));
    }
    
    const now = new Date();
    return await FirestoreRetryUtil.withRetry(async () => {
      const docRef = await addDoc(collection(db, 'team_members'), {
        teamId,
        userId,
        role,
        createdAt: Timestamp.fromDate(now),
      });
      
      return {
        id: docRef.id,
        teamId,
        userId,
        role,
        createdAt: now,
      };
    });
  }

  /**
   * Update a team member's role
   * Enforces contributor limits when upgrading to contributor role
   */
  async updateTeamMemberRole(membershipId: string, role: TeamMember['role'], teamId: string): Promise<void> {
    // Get current member to check if we're upgrading from viewer
    const memberDoc = await getDoc(doc(db, 'team_members', membershipId));
    if (!memberDoc.exists()) {
      throw new Error('Team member not found');
    }
    
    const currentRole = memberDoc.data().role as TeamMember['role'];
    
    // If upgrading to contributor role, check limits
    if (role !== 'viewer' && currentRole === 'viewer') {
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      
      const currentMembers = await this.getTeamMembers(teamId);
      // Filter out the member being upgraded to check if adding would exceed
      const otherMembers = currentMembers.filter(m => m.id !== membershipId);
      if (wouldExceedContributorLimit(team, otherMembers, role)) {
        throw new Error(getContributorLimitMessage(team));
      }
    }
    
    await FirestoreRetryUtil.withRetry(async () => {
      const memberRef = doc(db, 'team_members', membershipId);
      await updateDoc(memberRef, { role });
    });
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(membershipId: string): Promise<void> {
    await FirestoreRetryUtil.withRetry(async () => {
      await deleteDoc(doc(db, 'team_members', membershipId));
    });
  }

  /**
   * Check if user has access to team (is a member)
   */
  async userHasAccessToTeam(userId: string, teamId: string): Promise<boolean> {
    const role = await this.getUserTeamRole(userId, teamId);
    return role !== null;
  }

  /**
   * Check if user can manage team (owner or admin)
   */
  async userCanManageTeam(userId: string, teamId: string): Promise<boolean> {
    const role = await this.getUserTeamRole(userId, teamId);
    return role === 'owner' || role === 'admin';
  }

  /**
   * Create or get default team for a user
   * Used for migration: creates a team for existing users
   * New teams default to "basic" plan with "trial" status
   */
  async getOrCreateDefaultTeam(userId: string, userName: string): Promise<Team> {
    // Check if user already has teams
    const teams = await this.getUserTeams(userId);
    if (teams.length > 0) {
      return teams[0]; // Return first team
    }
    
    // Create default team with basic plan and trial status
    const teamName = `${userName}'s Team`;
    return await this.createTeam(teamName, userId, 'trial');
  }

  /**
   * Update team billing/subscription information
   */
  async updateTeamBilling(
    teamId: string,
    updates: Partial<Pick<Team, 'billingCustomerId' | 'subscriptionStatus' | 'subscriptionPlan' | 'subscriptionRenewsAt' | 'plan'>>
  ): Promise<Team> {
    return await FirestoreRetryUtil.withRetry(async () => {
      const teamRef = doc(db, 'teams', teamId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };
      
      // Convert Date to Timestamp for subscriptionRenewsAt
      if (updates.subscriptionRenewsAt !== undefined) {
        updateData.subscriptionRenewsAt = updates.subscriptionRenewsAt
          ? Timestamp.fromDate(updates.subscriptionRenewsAt)
          : null;
      }
      
      await updateDoc(teamRef, updateData);
      
      const updatedDoc = await getDoc(teamRef);
      const data = updatedDoc.data()!;
      return {
        id: teamId,
        name: data.name,
        slug: data.slug,
        ownerUserId: data.ownerUserId,
        plan: data.plan || 'basic',
        billingCustomerId: data.billingCustomerId || null,
        subscriptionStatus: data.subscriptionStatus || 'inactive',
        subscriptionPlan: data.subscriptionPlan || null,
        subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    });
  }
}

export const teamService = new TeamService();

