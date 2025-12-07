import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { APIKey } from '../types';
import { FirestoreRetryUtil } from './firestore-utils';

/**
 * Generate a secure random API key
 * Format: scotty_<random 32 chars>
 */
export function generateAPIKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomPart = Array.from({ length: 32 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  return `scotty_${randomPart}`;
}

/**
 * Hash an API key using SHA-256
 * Uses Web Crypto API for secure hashing
 */
export async function hashAPIKey(key: string): Promise<string> {
  // Use Web Crypto API (available in browser, Node.js 15+, and Deno)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without Web Crypto API
  // This should not happen in modern environments, but provides a fallback
  throw new Error('Web Crypto API not available. Cannot hash API key securely.');
}

/**
 * Verify an API key against a hash
 */
export async function verifyAPIKey(key: string, keyHash: string): Promise<boolean> {
  const computedHash = await hashAPIKey(key);
  return computedHash === keyHash;
}

class APIKeyService {
  /**
   * Create a new API key for a team
   * Returns the plain key (only shown once) and the APIKey object
   */
  async createAPIKey(teamId: string, name: string): Promise<{ key: string; apiKey: APIKey }> {
    const plainKey = generateAPIKey();
    const keyHash = await hashAPIKey(plainKey);
    const now = new Date();

    const apiKey = await FirestoreRetryUtil.withRetry(async () => {
      const docRef = await addDoc(collection(db, 'api_keys'), {
        teamId,
        name,
        keyHash,
        isRevoked: false,
        createdAt: Timestamp.fromDate(now),
        lastUsedAt: null,
      });

      return {
        id: docRef.id,
        teamId,
        name,
        keyHash,
        isRevoked: false,
        createdAt: now,
        lastUsedAt: null,
      };
    });

    return { key: plainKey, apiKey };
  }

  /**
   * Get all API keys for a team
   */
  async getTeamAPIKeys(teamId: string): Promise<APIKey[]> {
    try {
      const apiKeysRef = collection(db, 'api_keys');
      const q = query(
        apiKeysRef,
        where('teamId', '==', teamId),
        where('isRevoked', '==', false)
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          teamId: data.teamId,
          name: data.name,
          keyHash: data.keyHash,
          isRevoked: data.isRevoked || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          lastUsedAt: data.lastUsedAt?.toDate() || null,
        };
      });
    } catch (error) {
      console.error('Error getting team API keys:', error);
      return [];
    }
  }

  /**
   * Revoke an API key
   */
  async revokeAPIKey(apiKeyId: string): Promise<void> {
    await FirestoreRetryUtil.withRetry(async () => {
      const apiKeyRef = doc(db, 'api_keys', apiKeyId);
      await updateDoc(apiKeyRef, {
        isRevoked: true,
      });
    });
  }

  /**
   * Find API key by hash (for authentication)
   */
  async findAPIKeyByHash(keyHash: string): Promise<APIKey | null> {
    try {
      const apiKeysRef = collection(db, 'api_keys');
      const q = query(
        apiKeysRef,
        where('keyHash', '==', keyHash),
        where('isRevoked', '==', false)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        teamId: data.teamId,
        name: data.name,
        keyHash: data.keyHash,
        isRevoked: data.isRevoked || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUsedAt: data.lastUsedAt?.toDate() || null,
      };
    } catch (error) {
      console.error('Error finding API key by hash:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp for an API key
   */
  async updateLastUsed(apiKeyId: string): Promise<void> {
    await FirestoreRetryUtil.withRetry(async () => {
      const apiKeyRef = doc(db, 'api_keys', apiKeyId);
      await updateDoc(apiKeyRef, {
        lastUsedAt: Timestamp.fromDate(new Date()),
      });
    });
  }

  /**
   * Authenticate API key from request
   * Returns the API key object if valid, null otherwise
   */
  async authenticateAPIKey(authHeader: string | null): Promise<APIKey | null> {
    if (!authHeader) return null;

    // Support both "Bearer <token>" and "Api-Key <token>" formats
    const match = authHeader.match(/^(?:Bearer|Api-Key)\s+(.+)$/i);
    if (!match) return null;

    const plainKey = match[1];
    const keyHash = await hashAPIKey(plainKey);
    const apiKey = await this.findAPIKeyByHash(keyHash);

    if (apiKey) {
      // Update last used timestamp
      await this.updateLastUsed(apiKey.id);
    }

    return apiKey;
  }
}

export const apiKeyService = new APIKeyService();

