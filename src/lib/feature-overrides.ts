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
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { TeamFeatureOverride } from '../types';
import { FeatureKey } from './features';
import { FirestoreRetryUtil } from './firestore-utils';

class FeatureOverrideService {
  /**
   * Get all feature overrides for a team
   */
  async getTeamOverrides(teamId: string): Promise<TeamFeatureOverride[]> {
    try {
      const overridesRef = collection(db, 'team_feature_overrides');
      const q = query(overridesRef, where('teamId', '==', teamId));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          teamId: data.teamId,
          featureKey: data.featureKey,
          enabled: data.enabled,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      });
    } catch (error) {
      console.error('Error getting team overrides:', error);
      return [];
    }
  }

  /**
   * Set a feature override for a team
   */
  async setFeatureOverride(
    teamId: string,
    featureKey: FeatureKey,
    enabled: boolean
  ): Promise<TeamFeatureOverride> {
    // Check if override already exists
    const existing = await this.getFeatureOverride(teamId, featureKey);

    const now = new Date();

    if (existing) {
      // Update existing override
      return await FirestoreRetryUtil.withRetry(async () => {
        const overrideRef = doc(db, 'team_feature_overrides', existing.id);
        await updateDoc(overrideRef, {
          enabled,
          updatedAt: Timestamp.fromDate(now),
        });

        return {
          ...existing,
          enabled,
          updatedAt: now,
        };
      });
    } else {
      // Create new override
      return await FirestoreRetryUtil.withRetry(async () => {
        const docRef = await addDoc(collection(db, 'team_feature_overrides'), {
          teamId,
          featureKey,
          enabled,
          createdAt: Timestamp.fromDate(now),
          updatedAt: Timestamp.fromDate(now),
        });

        return {
          id: docRef.id,
          teamId,
          featureKey,
          enabled,
          createdAt: now,
          updatedAt: now,
        };
      });
    }
  }

  /**
   * Get a specific feature override for a team
   */
  async getFeatureOverride(
    teamId: string,
    featureKey: FeatureKey
  ): Promise<TeamFeatureOverride | null> {
    try {
      const overridesRef = collection(db, 'team_feature_overrides');
      const q = query(
        overridesRef,
        where('teamId', '==', teamId),
        where('featureKey', '==', featureKey)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        featureKey: data.featureKey,
        enabled: data.enabled,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      console.error('Error getting feature override:', error);
      return null;
    }
  }

  /**
   * Remove a feature override (revert to plan default)
   */
  async removeFeatureOverride(teamId: string, featureKey: FeatureKey): Promise<void> {
    const override = await this.getFeatureOverride(teamId, featureKey);
    if (!override) return;

    await FirestoreRetryUtil.withRetry(async () => {
      await deleteDoc(doc(db, 'team_feature_overrides', override.id));
    });
  }

  /**
   * Remove all overrides for a team
   */
  async removeAllTeamOverrides(teamId: string): Promise<void> {
    const overrides = await this.getTeamOverrides(teamId);
    await Promise.all(
      overrides.map(override =>
        FirestoreRetryUtil.withRetry(async () => {
          await deleteDoc(doc(db, 'team_feature_overrides', override.id));
        })
      )
    );
  }
}

export const featureOverrideService = new FeatureOverrideService();

