import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Helper to clean and fix common JSON issues
function cleanJSONString(jsonString: string): string {
  let cleaned = jsonString.trim();
  
  // Remove any leading/trailing quotes that Vercel might add
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
    // Unescape if it was escaped
    cleaned = cleaned.replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  
  // Replace escaped newlines with actual newlines, then remove them
  cleaned = cleaned.replace(/\\n/g, ' ').replace(/\\r/g, ' ');
  
  // Remove actual newlines and carriage returns
  cleaned = cleaned.replace(/\n/g, ' ').replace(/\r/g, ' ');
  
  // Replace single quotes with double quotes (common mistake)
  // But be careful - only replace single quotes that are property delimiters
  // This is a simple heuristic - it might not catch all cases
  cleaned = cleaned.replace(/'/g, '"');
  
  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

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
          // Show first 100 chars for debugging (safe - no secrets exposed)
          const preview = envVar.substring(0, 100);
          console.log('🔍 Attempting to parse FIREBASE_SERVICE_ACCOUNT (first 100 chars):', preview);
          console.log('📏 Total length:', envVar.length);
          
          // Check for common issues
          const hasSingleQuotes = envVar.includes("'");
          const hasLineBreaks = envVar.includes('\n') || envVar.includes('\r');
          const startsWithBrace = envVar.trim().startsWith('{');
          
          if (hasSingleQuotes) {
            console.warn('⚠️ Found single quotes in JSON - will attempt to fix');
          }
          if (hasLineBreaks) {
            console.warn('⚠️ Found line breaks in JSON - will attempt to fix');
          }
          if (!startsWithBrace) {
            console.error('❌ JSON does not start with { - may be missing or malformed');
            console.error('First 50 chars:', envVar.substring(0, 50));
          }
          
          // Try to parse as-is first
          try {
            serviceAccount = JSON.parse(envVar);
            console.log('✅ Successfully parsed FIREBASE_SERVICE_ACCOUNT (as-is)');
          } catch (firstAttempt: any) {
            console.warn('⚠️ First parse attempt failed, trying to clean JSON...');
            console.warn('First attempt error:', firstAttempt.message);
            
            // Try cleaning the JSON
            try {
              const cleaned = cleanJSONString(envVar);
              console.log('🧹 Cleaned JSON (first 100 chars):', cleaned.substring(0, 100));
              serviceAccount = JSON.parse(cleaned);
              console.log('✅ Successfully parsed FIREBASE_SERVICE_ACCOUNT (after cleaning)');
            } catch (cleanedAttempt: any) {
              // Both attempts failed - show detailed error
              const preview = envVar.substring(0, 200);
              console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT as JSON (both attempts)');
              console.error('Original error:', firstAttempt.message);
              console.error('Cleaned error:', cleanedAttempt.message);
              console.error('Error position (original):', firstAttempt.message.match(/position (\d+)/)?.[1] || 'unknown');
              console.error('First 200 chars of original value:', preview);
              console.error('⚠️ The FIREBASE_SERVICE_ACCOUNT environment variable must be valid JSON.');
              console.error('⚠️ Common issues:');
              console.error('   - Using single quotes instead of double quotes');
              console.error('   - Line breaks in the JSON (must be single line)');
              console.error('   - Missing or extra commas/braces');
              console.error('   - Vercel escaping the JSON incorrectly');
              console.error('⚠️ Fix: Go to Vercel → Settings → Environment Variables');
              console.error('⚠️ Delete and recreate FIREBASE_SERVICE_ACCOUNT with minified single-line JSON');
              throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT JSON: ${firstAttempt.message}. Check Vercel environment variables - must be valid single-line JSON. Original error at position ${firstAttempt.message.match(/position (\d+)/)?.[1] || 'unknown'}.`);
            }
          }
        } else {
          serviceAccount = envVar;
        }
      } catch (parseError: any) {
        // This catch should not be reached due to nested try-catch, but just in case
        console.error('❌ Unexpected error parsing FIREBASE_SERVICE_ACCOUNT:', parseError);
        throw parseError;
      }
    }
    
    if (serviceAccount) {
      try {
        // Validate service account has required fields
        if (!serviceAccount.project_id && !serviceAccount.projectId) {
          throw new Error('Service account missing project_id');
        }
        if (!serviceAccount.private_key) {
          throw new Error('Service account missing private_key');
        }
        if (!serviceAccount.client_email) {
          throw new Error('Service account missing client_email');
        }
        
        initializeApp({ credential: cert(serviceAccount) });
        console.log('✅ Firebase Admin initialized with service account');
        console.log('📋 Project ID:', serviceAccount.project_id || serviceAccount.projectId);
      } catch (initError: any) {
        console.error('❌ Failed to initialize Firebase Admin with service account:', initError.message);
        console.error('Service account keys present:', {
          hasProjectId: !!(serviceAccount.project_id || serviceAccount.projectId),
          hasPrivateKey: !!serviceAccount.private_key,
          hasClientEmail: !!serviceAccount.client_email
        });
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


