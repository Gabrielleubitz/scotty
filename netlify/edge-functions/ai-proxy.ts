export default async (request: Request) => {
  console.log('Edge Function called:', request.method, request.url);
  
  // Get AI Agent API key from environment variables (secure server-side)
  const AI_AGENT_API_KEY = Deno.env.get('AI_AGENT_API_KEY');
  
  if (!AI_AGENT_API_KEY) {
    console.error('AI_AGENT_API_KEY environment variable not set');
    return new Response(JSON.stringify({ 
      error: 'AI Agent API key not configured on server' 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  // Function to format AI response and embed YouTube links
  function formatResponse(response: string): string {
    // First, handle YouTube URLs (with or without parentheses) and embed them
    // Updated to handle spaces between parentheses and URL
    const YOUTUBE_REGEX = /(\(\s*)?https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]{11})(\s*\))?/g;
    let formattedResponse = response.replace(YOUTUBE_REGEX, (match, openParen, id, closeParen) => 
      `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: auto !important; z-index: 9999 !important; border: none; outline: none;"></iframe>`
    );
    
    // Then, convert remaining URLs in parentheses to clickable links that open in new tab
    const URL_IN_PARENS_REGEX = /\(\s*(https?:\/\/[^\s\)]+)\s*\)/g;
    formattedResponse = formattedResponse.replace(URL_IN_PARENS_REGEX, '<a href="$1" target="_blank">$1</a>');
    
    // Finally, convert any remaining URLs (without parentheses) to clickable links that open in new tab
    // But exclude URLs that are already inside HTML attributes (like iframe src)
    const REMAINING_URL_REGEX = /(?<!src="|href=")https?:\/\/[^\s<"]+(?!")/g;
    formattedResponse = formattedResponse.replace(REMAINING_URL_REGEX, '<a href="$&" target="_blank">$&</a>');
    
    return formattedResponse;
  }
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-API-URL',
      },
    });
  }
  
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
  
  try {
    // Get the request body
    const body = await request.text();
    console.log('Edge Function - Request body:', body);
    
    // Get the API URL from headers (sent by frontend)
    const apiBaseUrl = request.headers.get('X-API-URL') || 'https://aiagent.net2phone.com';
    
    // Smart URL handling - remove /api if it exists, then add /api/chat
    const cleanBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
    const apiUrl = `${cleanBaseUrl}/api/chat`;
    
    console.log('Edge Function - Making request to:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_AGENT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    });
    
    console.log('Edge Function - Response status:', response.status);
    
    // Get the response data
    const rawData = await response.text();
    console.log('Edge Function - Response data:', rawData);
    
    // Parse the response and format YouTube links if it's JSON
    let formattedData = rawData;
    try {
      const jsonData = JSON.parse(rawData);
      if (jsonData.message) {
        jsonData.message = formatResponse(jsonData.message);
        formattedData = JSON.stringify(jsonData);
        console.log('Edge Function - Formatted YouTube links in response');
      }
    } catch (e) {
      // If not JSON, try to format as plain text
      formattedData = formatResponse(rawData);
      console.log('Edge Function - Formatted YouTube links in plain text response');
    }
    
    // Return the response with CORS headers
    return new Response(formattedData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-API-URL',
      },
    });
  } catch (error) {
    console.error('Edge Function - Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};