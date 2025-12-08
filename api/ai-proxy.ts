/**
 * Vercel serverless function for AI proxy
 * Replaces Netlify edge function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Function to format AI response and embed YouTube links
function formatResponse(response: string): string {
  // First, handle YouTube URLs (with or without parentheses) and embed them
  const YOUTUBE_REGEX = /(\(\s*)?https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]{11})(\s*\))?/g;
  let formattedResponse = response.replace(YOUTUBE_REGEX, (match, openParen, id, closeParen) => 
    `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: auto !important; z-index: 9999 !important; border: none; outline: none;"></iframe>`
  );
  
  // Then, convert remaining URLs in parentheses to clickable links that open in new tab
  const URL_IN_PARENS_REGEX = /\(\s*(https?:\/\/[^\s\)]+)\s*\)/g;
  formattedResponse = formattedResponse.replace(URL_IN_PARENS_REGEX, '<a href="$1" target="_blank">$1</a>');
  
  // Finally, convert any remaining URLs (without parentheses) to clickable links that open in new tab
  const REMAINING_URL_REGEX = /(?<!src="|href=")https?:\/\/[^\s<"]+(?!")/g;
  formattedResponse = formattedResponse.replace(REMAINING_URL_REGEX, '<a href="$&" target="_blank">$&</a>');
  
  return formattedResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-API-URL');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get AI Agent API key from environment variables
    const AI_AGENT_API_KEY = process.env.AI_AGENT_API_KEY;
    
    if (!AI_AGENT_API_KEY) {
      console.error('AI_AGENT_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'AI Agent API key not configured on server' 
      });
    }

    // Get the API URL from headers (sent by frontend)
    const apiBaseUrl = req.headers['x-api-url'] as string || 'https://api.openai.com/v1';
    
    // For OpenAI API, use /chat/completions endpoint
    // For custom APIs, use /api/chat
    let apiUrl: string;
    let requestBody: any;
    
    if (apiBaseUrl.includes('openai.com')) {
      apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/chat/completions`;
      // Transform request to OpenAI format
      requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: req.body.message || 'Hello'
          }
        ],
        stream: false
      };
    } else {
      // Smart URL handling for custom APIs - remove /api if it exists, then add /api/chat
      const cleanBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
      apiUrl = `${cleanBaseUrl}/api/chat`;
      requestBody = req.body; // Use original body for custom APIs
    }
    
    console.log('AI Proxy - Making request to:', apiUrl);
    console.log('AI Proxy - Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_AGENT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('AI Proxy - Response status:', response.status);
    
    // Get the response data
    const rawData = await response.text();
    console.log('AI Proxy - Response data:', rawData);
    
    // Parse the response and format YouTube links if it's JSON
    let formattedData = rawData;
    try {
      const jsonData = JSON.parse(rawData);
      
      // Handle OpenAI response format
      if (apiBaseUrl.includes('openai.com') && jsonData.choices && jsonData.choices[0]) {
        const openAIResponse = {
          message: jsonData.choices[0].message?.content || '',
          session_id: req.body.session_id || jsonData.id,
        };
        openAIResponse.message = formatResponse(openAIResponse.message);
        return res.status(response.status).json(openAIResponse);
      }
      
      // Handle custom API response format
      if (jsonData.message) {
        jsonData.message = formatResponse(jsonData.message);
        formattedData = JSON.stringify(jsonData);
        console.log('AI Proxy - Formatted YouTube links in response');
      }
      return res.status(response.status).json(jsonData);
    } catch (e) {
      // If not JSON, try to format as plain text
      formattedData = formatResponse(rawData);
      console.log('AI Proxy - Formatted YouTube links in plain text response');
      return res.status(response.status).send(formattedData);
    }
  } catch (error) {
    console.error('AI Proxy - Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

