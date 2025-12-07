/**
 * Vercel serverless function for tracking post views
 * Replaces Netlify edge function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
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
    const { postId, domain, userId, timestamp } = req.body;
    
    if (!postId) {
      return res.status(400).json({ error: 'postId is required' });
    }

    // For now, we'll simulate the view increment
    // In a real implementation, you would:
    // 1. Connect to Firebase Admin SDK
    // 2. Increment the view count in Firestore
    // 3. Store the view tracking data
    
    console.log('📊 View tracked for post:', postId);
    console.log('👤 User:', userId);
    console.log('🌐 Domain:', domain);
    console.log('⏰ Timestamp:', timestamp);

    // Simulate successful tracking
    return res.status(200).json({ 
      success: true,
      message: 'View tracked successfully',
      postId,
      domain,
      userId
    });
  } catch (error) {
    console.error('Track View - Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'View tracking failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

