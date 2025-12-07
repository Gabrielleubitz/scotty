/**
 * External API endpoint for managing changelog posts
 * Vercel serverless function
 * 
 * Authentication: API key via Authorization header
 * Format: "Bearer <api-key>" or "Api-Key <api-key>"
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side only)
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // For development, allow missing service account (will fail gracefully)
    if (!serviceAccount) {
      console.warn('FIREBASE_SERVICE_ACCOUNT not configured. API endpoints will not work.');
      // Try to initialize with default credentials (for local development with gcloud)
      try {
        initializeApp();
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw new Error('Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT environment variable.');
      }
    } else {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount)),
      });
    }
  }
  return getFirestore();
}

// Hash API key (same logic as client-side)
async function hashAPIKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Authenticate API key
async function authenticateAPIKey(authHeader: string | null): Promise<{ teamId: string; apiKeyId: string } | null> {
  if (!authHeader) return null;

  const match = authHeader.match(/^(?:Bearer|Api-Key)\s+(.+)$/i);
  if (!match) return null;

  const plainKey = match[1];
  const keyHash = await hashAPIKey(plainKey);

  const db = getFirebaseAdmin();
  const apiKeysRef = db.collection('api_keys');
  const snapshot = await apiKeysRef
    .where('keyHash', '==', keyHash)
    .where('isRevoked', '==', false)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const apiKeyDoc = snapshot.docs[0];
  const data = apiKeyDoc.data();

  // Update last used timestamp
  await apiKeyDoc.ref.update({
    lastUsedAt: Timestamp.now(),
  });

  return {
    teamId: data.teamId,
    apiKeyId: apiKeyDoc.id,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate API key
    const auth = await authenticateAPIKey(req.headers.authorization || null);
    if (!auth) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing API key. Provide it in the Authorization header as "Bearer <key>" or "Api-Key <key>".',
      });
    }

    const { teamId } = auth;
    const db = getFirebaseAdmin();

    // GET /api/external/v1/posts - List posts
    if (req.method === 'GET') {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100); // Max 100
      const offset = parseInt(req.query.offset as string) || 0;

      const postsRef = db.collection('changelog');
      const query = postsRef
        .where('teamId', '==', teamId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(limit + offset); // Fetch more to account for offset

      const snapshot = await query.get();
      
      // Apply offset in memory (Firestore Admin doesn't support offset)
      const allDocs = snapshot.docs.slice(offset, offset + limit);

      const posts = allDocs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          content: data.content,
          category: data.category,
          status: data.status,
          views: data.views || 0,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
        };
      });

      return res.status(200).json({
        posts,
        pagination: {
          limit,
          offset,
          total: posts.length,
        },
      });
    }

    // POST /api/external/v1/posts - Create post
    if (req.method === 'POST') {
      const { title, content, category, status = 'published' } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'title and content are required',
        });
      }

      const now = new Date();
      const postData: {
        teamId: string;
        title: string;
        content: string;
        category: string;
        status: string;
        views: number;
        createdAt: Timestamp;
        updatedAt: Timestamp;
        publishedAt?: Timestamp;
      } = {
        teamId,
        title,
        content,
        category: category || 'NOTIFICATION',
        status,
        views: 0,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      if (status === 'published') {
        postData.publishedAt = Timestamp.fromDate(now);
      }

      const postsRef = db.collection('changelog');
      const docRef = await postsRef.add(postData);

      const createdPost = {
        id: docRef.id,
        ...postData,
        createdAt: postData.createdAt.toDate().toISOString(),
        updatedAt: postData.updatedAt.toDate().toISOString(),
        publishedAt: postData.publishedAt?.toDate().toISOString(),
      };

      return res.status(201).json({
        post: createdPost,
      });
    }

    return res.status(405).json({
      error: 'Method Not Allowed',
      message: `Method ${req.method} not allowed`,
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
}

