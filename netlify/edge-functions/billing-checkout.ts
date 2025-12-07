/**
 * Netlify Edge Function for creating Stripe checkout sessions
 * For Vercel, this should be converted to an API route in api/billing/create-checkout-session.ts
 */

export default async (request: Request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    const STRIPE_PRICE_BASIC = Deno.env.get('STRIPE_PRICE_BASIC');
    const STRIPE_PRICE_PRO = Deno.env.get('STRIPE_PRICE_PRO');
    const SITE_URL = Deno.env.get('SITE_URL') || request.headers.get('origin') || 'http://localhost:5173';

    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Please contact support to manage billing.' }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const body = await request.json();
    const { teamId, targetPlan } = body;

    if (!teamId || !targetPlan) {
      return new Response(JSON.stringify({ error: 'teamId and targetPlan are required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (targetPlan !== 'basic' && targetPlan !== 'pro') {
      return new Response(JSON.stringify({ error: 'targetPlan must be "basic" or "pro"' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const priceId = targetPlan === 'basic' ? STRIPE_PRICE_BASIC : STRIPE_PRICE_PRO;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Stripe price ID not configured for ${targetPlan} plan` }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // Create Stripe checkout session
    // Note: In a real implementation, you'd use the Stripe SDK
    // For Deno/Edge Functions, you can use fetch to Stripe API directly
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'subscription',
        payment_method_types: 'card',
        line_items: JSON.stringify([{
          price: priceId,
          quantity: 1,
        }]),
        success_url: `${SITE_URL}/settings/team?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE_URL}/settings/team?canceled=true`,
        metadata: JSON.stringify({
          teamId,
          targetPlan,
        }),
      }),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('Stripe API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const session = await stripeResponse.json();

    return new Response(
      JSON.stringify({ redirectUrl: session.url }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
};

