import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Helper to clean and fix common JSON issues (same as posts.ts)
function cleanJSONString(jsonString: string): string {
  let cleaned = jsonString.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
    cleaned = cleaned.replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  cleaned = cleaned.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
  cleaned = cleaned.replace(/\n/g, ' ').replace(/\r/g, ' ');
  cleaned = cleaned.replace(/'/g, '"');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

// Initialize Firebase Admin
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    let serviceAccount: any = null;
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (envVar) {
      try {
        if (typeof envVar === 'string') {
          try {
            serviceAccount = JSON.parse(envVar);
          } catch (firstAttempt: any) {
            console.warn('⚠️ First parse failed, trying cleaned version...');
            const cleaned = cleanJSONString(envVar);
            serviceAccount = JSON.parse(cleaned);
          }
        } else {
          serviceAccount = envVar;
        }
      } catch (parseError: any) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', parseError.message);
        throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${parseError.message}`);
      }
    }
    
    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      try {
        initializeApp();
      } catch (error: any) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw new Error('Firebase Admin not configured');
      }
    }
  }
  return getFirestore();
}

// db will be initialized per-request

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getFirebaseAdmin();
    const { postId, incrementBy = 1 } = req.body;

    if (!postId || typeof postId !== 'string') {
      return res.status(400).json({ error: 'postId is required' });
    }

    // Verify post exists and is published
    const postRef = db.collection('changelog').doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const postData = postDoc.data();
    if (postData?.status !== 'published') {
      return res.status(403).json({ error: 'Can only increment views on published posts' });
    }

    // Increment view count
    await postRef.update({
      views: FieldValue.increment(typeof incrementBy === 'number' ? incrementBy : 1)
    });

    return res.status(200).json({
      success: true,
      message: 'View count incremented'
    });

  } catch (error: any) {
    console.error('Error incrementing view count:', error);
    return res.status(500).json({ 
      error: 'Failed to increment view count',
      message: error.message 
    });
  }
}


