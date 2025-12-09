import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount))
      });
    } else {
      initializeApp();
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = getFirestore();

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

