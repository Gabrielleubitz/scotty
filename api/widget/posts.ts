import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    let serviceAccount: any = null;
    
    // Try to get service account from environment variable (for Vercel/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Fallback to old env var name
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }
    
    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      // Try to initialize with default credentials (for local development)
      try {
        initializeApp();
        console.log('Initialized Firebase Admin with default credentials');
      } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw new Error('Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT environment variable.');
      }
    }
  }
  return getFirestore();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { teamId, productId, domain } = req.query;

    if (!teamId || typeof teamId !== 'string') {
      return res.status(400).json({ error: 'teamId is required' });
    }

    const db = getFirebaseAdmin();

    // Get published posts for the team
    // Note: If orderBy fails due to missing index, we'll fetch all and sort in memory
    let snapshot;
    try {
      const postsRef = db.collection('changelog');
      const query = postsRef
        .where('teamId', '==', teamId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(50);
      
      snapshot = await query.get();
    } catch (queryError: any) {
      // If orderBy fails (missing index), fetch without orderBy and sort in memory
      if (queryError.code === 'failed-precondition' || queryError.message?.includes('index')) {
        console.warn('Composite index missing, fetching without orderBy and sorting in memory');
        const postsRef = db.collection('changelog');
        const query = postsRef
          .where('teamId', '==', teamId)
          .where('status', '==', 'published')
          .limit(50);
        
        snapshot = await query.get();
        
        // Sort in memory by createdAt
        const docs = snapshot.docs.sort((a, b) => {
          const aTime = a.data().createdAt?.toMillis?.() || 0;
          const bTime = b.data().createdAt?.toMillis?.() || 0;
          return bTime - aTime; // Descending
        });
        
        // Create a mock snapshot-like object
        snapshot = { docs } as any;
      } else {
        throw queryError;
      }
    }
    
    let posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        content: data.content || '',
        category: data.category || 'Update',
        status: data.status || 'published',
        teamId: data.teamId || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        views: data.views || 0,
        imageUrl: data.imageUrl || undefined,
        videoUrl: data.videoUrl || undefined,
        tags: data.tags || [],
        segmentIds: data.segmentIds || [],
        translations: data.translations || {}
      };
    });

    // Filter by domain/segment if provided
    if (domain && typeof domain === 'string') {
      try {
        // Remove port number from domain if present (e.g., "www.igani.co:1" -> "www.igani.co")
        const cleanDomain = domain.split(':')[0];
        
        const segmentsSnapshot = await db.collection('segments')
          .where('teamId', '==', teamId)
          .get();
        
        const segments = segmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const currentSegment = segments.find(seg => {
          const segDomain = seg.domain || '';
          return segDomain === cleanDomain || 
                 segDomain === `www.${cleanDomain}` ||
                 `www.${segDomain}` === cleanDomain ||
                 segDomain === domain ||
                 segDomain === `www.${domain}` ||
                 `www.${segDomain}` === domain;
        });

        if (currentSegment) {
          posts = posts.filter(post => 
            !post.segmentIds || 
            post.segmentIds.length === 0 || 
            post.segmentIds.includes(currentSegment.id)
          );
        } else {
          // If no segment found, show posts without segments
          posts = posts.filter(post => !post.segmentIds || post.segmentIds.length === 0);
        }
      } catch (error) {
        console.error('Error filtering by segment:', error);
        // Continue without filtering on error
      }
    }

    return res.status(200).json({
      success: true,
      posts: posts.slice(0, 20), // Limit to 20 posts
      count: posts.length
    });

  } catch (error: any) {
    console.error('Error fetching widget posts:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch posts',
      message: error.message 
    });
  }
}


