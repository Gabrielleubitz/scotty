import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      initializeApp({
        credential: cert(JSON.parse(serviceAccount))
      });
    } else {
      // Fallback to default credentials if available
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

    // Get published posts for the team
    const postsRef = db.collection('changelog');
    const query = postsRef
      .where('teamId', '==', teamId)
      .where('status', '==', 'published')
      .orderBy('createdAt', 'desc')
      .limit(50);

    const snapshot = await query.get();
    
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
        const segmentsSnapshot = await db.collection('segments')
          .where('teamId', '==', teamId)
          .get();
        
        const segments = segmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const currentSegment = segments.find(seg => 
          seg.domain === domain || 
          seg.domain === `www.${domain}` ||
          `www.${seg.domain}` === domain
        );

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

