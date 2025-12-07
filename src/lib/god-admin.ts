/**
 * God Admin Service
 * Functions for managing users and teams as a god/admin
 */

import { collection, getDocs, doc, updateDoc, query, where, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User, Team } from '../types';
import { FirestoreRetryUtil } from './firestore-utils';

class GodAdminService {
  /**
   * Get all users in the system
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          name: data.name || '',
          displayName: data.displayName || data.name || '',
          avatarUrl: data.avatarUrl || data.avatar || undefined,
          role: data.role || 'user',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      });
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Update a user's role
   */
  async updateUserRole(userId: string, newRole: 'god' | 'admin' | 'user'): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await FirestoreRetryUtil.withRetry(async () => {
        await updateDoc(userRef, {
          role: newRole,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });
    } catch (error) {
      console.error(`Error updating user role for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get all teams in the system
   */
  async getAllTeams(): Promise<Team[]> {
    try {
      const teamsRef = collection(db, 'teams');
      const querySnapshot = await getDocs(teamsRef);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          slug: data.slug || '',
          ownerUserId: data.ownerUserId || '',
          plan: data.plan || 'basic',
          billingCustomerId: data.billingCustomerId || null,
          subscriptionStatus: data.subscriptionStatus || 'inactive',
          subscriptionPlan: data.subscriptionPlan || null,
          subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Team;
      });
    } catch (error) {
      console.error('Error fetching all teams:', error);
      throw error;
    }
  }

  /**
   * Update a team's plan
   */
  async updateTeamPlan(
    teamId: string, 
    plan: 'basic' | 'pro' | 'trial' | 'legacy',
    subscriptionStatus?: 'inactive' | 'active' | 'past_due' | 'canceled' | 'trial'
  ): Promise<void> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const updateData: any = {
        plan: plan === 'trial' ? 'basic' : plan,
        subscriptionPlan: plan === 'trial' ? 'basic' : (plan === 'pro' ? 'pro' : null),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (subscriptionStatus) {
        updateData.subscriptionStatus = subscriptionStatus;
      } else if (plan === 'trial') {
        updateData.subscriptionStatus = 'trial';
      } else if (plan === 'pro') {
        updateData.subscriptionStatus = 'active';
      }

      await FirestoreRetryUtil.withRetry(async () => {
        await updateDoc(teamRef, updateData);
      });
    } catch (error) {
      console.error(`Error updating team plan for ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        name: data.name || '',
        displayName: data.displayName || data.name || '',
        avatarUrl: data.avatarUrl || data.avatar || undefined,
        role: data.role || 'user',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    } catch (error) {
      console.error(`Error fetching user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string): Promise<Team | null> {
    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamDoc = await getDoc(teamRef);
      
      if (!teamDoc.exists()) {
        return null;
      }
      
      const data = teamDoc.data();
      return {
        id: teamDoc.id,
        name: data.name || '',
        slug: data.slug || '',
        ownerUserId: data.ownerUserId || '',
        plan: data.plan || 'basic',
        billingCustomerId: data.billingCustomerId || null,
        subscriptionStatus: data.subscriptionStatus || 'inactive',
        subscriptionPlan: data.subscriptionPlan || null,
        subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Team;
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error);
      throw error;
    }
  }
}

export const godAdminService = new GodAdminService();

