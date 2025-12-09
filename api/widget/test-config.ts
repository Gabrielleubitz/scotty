import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Debug endpoint to test Firebase Admin configuration
 * This helps verify that FIREBASE_SERVICE_ACCOUNT is set correctly
 */
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
    const envVar = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    const diagnostics = {
      hasEnvVar: !!envVar,
      envVarLength: envVar ? envVar.length : 0,
      expectedLength: '1500-2000+ characters',
      isTooShort: envVar ? envVar.length < 500 : false,
      startsWithBrace: envVar ? envVar.trim().startsWith('{') : false,
      hasSingleQuotes: envVar ? envVar.includes("'") : false,
      hasLineBreaks: envVar ? (envVar.includes('\n') || envVar.includes('\r')) : false,
      first50Chars: envVar ? envVar.substring(0, 50) : 'N/A',
      last50Chars: envVar ? envVar.substring(Math.max(0, envVar.length - 50)) : 'N/A',
    };
    
    // Check if it's truncated
    if (envVar && envVar.length < 500) {
      diagnostics.isTooShort = true;
    }

    // Try to parse
    let parseSuccess = false;
    let parseError = null;
    if (envVar) {
      try {
        JSON.parse(envVar);
        parseSuccess = true;
      } catch (error: any) {
        parseError = {
          message: error.message,
          position: error.message.match(/position (\d+)/)?.[1] || 'unknown'
        };
      }
    }

    let message = '';
    if (diagnostics.isTooShort) {
      message = '❌ CRITICAL: FIREBASE_SERVICE_ACCOUNT is too short (' + diagnostics.envVarLength + ' chars). Expected 1500-2000+ characters. The JSON appears to be truncated. You need to set the FULL service account JSON in Vercel.';
    } else if (parseSuccess) {
      message = '✅ FIREBASE_SERVICE_ACCOUNT is valid JSON!';
    } else {
      message = '❌ FIREBASE_SERVICE_ACCOUNT has JSON errors. Check diagnostics above.';
    }

    return res.status(200).json({
      success: true,
      diagnostics,
      parseSuccess,
      parseError,
      message
    });

  } catch (error: any) {
    return res.status(500).json({ 
      error: 'Failed to test configuration',
      message: error.message 
    });
  }
}

