import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    let serviceAccount: any = null;
    
    // Try to get service account from environment variable (for Vercel/production)
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (envVar) {
      try {
        // Check if it's already an object (shouldn't happen, but be safe)
        if (typeof envVar === 'string') {
          // Try to parse as JSON
          serviceAccount = JSON.parse(envVar);
        } else {
          serviceAccount = envVar;
        }
        console.log('✅ Successfully parsed FIREBASE_SERVICE_ACCOUNT');
      } catch (parseError: any) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON:', parseError.message);
        console.error('⚠️ The FIREBASE_SERVICE_ACCOUNT environment variable must be valid JSON.');
        console.error('⚠️ Make sure it\'s set as a single-line JSON string in Vercel, not a multi-line file.');
        throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${parseError.message}. Please check your Vercel environment variables.`);
      }
    }
    
    if (serviceAccount) {
      try {
        initializeApp({ credential: cert(serviceAccount) });
        console.log('✅ Firebase Admin initialized with service account');
      } catch (initError: any) {
        console.error('❌ Failed to initialize Firebase Admin with service account:', initError.message);
        throw new Error(`Firebase Admin initialization failed: ${initError.message}`);
      }
    } else {
      // Try to initialize with default credentials (for local development)
      try {
        initializeApp();
        console.log('✅ Initialized Firebase Admin with default credentials');
      } catch (error: any) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
        throw new Error('Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT environment variable in Vercel with valid JSON.');
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

    console.log('📥 Widget posts request:', { teamId, domain, productId });

    let db;
    try {
      db = getFirebaseAdmin();
      console.log('✅ Firebase Admin initialized');
    } catch (initError: any) {
      console.error('❌ Firebase Admin initialization failed:', initError);
      return res.status(500).json({ 
        error: 'Database initialization failed',
        message: initError.message 
      });
    }

    // Get published posts for the team
    // Note: If orderBy fails due to missing index, we'll fetch all and sort in memory
    let snapshot;
    try {
      console.log('🔍 Querying posts for team:', teamId);
      const postsRef = db.collection('changelog');
      const query = postsRef
        .where('teamId', '==', teamId)
        .where('status', '==', 'published')
        .orderBy('createdAt', 'desc')
        .limit(50);
      
      snapshot = await query.get();
      console.log(`✅ Found ${snapshot.docs.length} posts with index`);
    } catch (queryError: any) {
      console.warn('⚠️ Query with orderBy failed:', queryError.code, queryError.message);
      
      // If orderBy fails (missing index), fetch without orderBy and sort in memory
      if (queryError.code === 'failed-precondition' || 
          queryError.code === 9 || 
          queryError.message?.includes('index') ||
          queryError.message?.includes('requires an index')) {
        console.log('📋 Composite index missing, fetching without orderBy and sorting in memory');
        
        try {
          const postsRef = db.collection('changelog');
          const query = postsRef
            .where('teamId', '==', teamId)
            .where('status', '==', 'published')
            .limit(50);
          
          snapshot = await query.get();
          console.log(`✅ Found ${snapshot.docs.length} posts without orderBy`);
          
          // Sort in memory by createdAt
          const docs = snapshot.docs.sort((a, b) => {
            const aData = a.data();
            const bData = b.data();
            const aTime = aData.createdAt?.toMillis?.() || 
                         (aData.createdAt?.seconds ? aData.createdAt.seconds * 1000 : 0) ||
                         (aData.createdAt ? new Date(aData.createdAt).getTime() : 0);
            const bTime = bData.createdAt?.toMillis?.() || 
                         (bData.createdAt?.seconds ? bData.createdAt.seconds * 1000 : 0) ||
                         (bData.createdAt ? new Date(bData.createdAt).getTime() : 0);
            return bTime - aTime; // Descending
          });
          
          // Create a mock snapshot-like object
          snapshot = { docs } as any;
        } catch (fallbackError: any) {
          console.error('❌ Fallback query also failed:', fallbackError);
          throw fallbackError;
        }
      } else {
        console.error('❌ Query error (not index-related):', queryError);
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
    console.error('❌ Error fetching widget posts:', error);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({ 
      error: 'Failed to fetch posts',
      message: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN'
    });
  }
}


