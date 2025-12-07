/**
 * Vercel serverless function for creating Stripe checkout sessions
 * Replaces Netlify edge function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
    const STRIPE_PRICE_BASIC = process.env.STRIPE_PRICE_BASIC;
    const STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO;
    const SITE_URL = process.env.SITE_URL || req.headers.origin || 'http://localhost:5173';

    if (!STRIPE_SECRET_KEY) {
      return res.status(503).json({
        error: 'Stripe not configured. Please contact support to manage billing.'
      });
    }

    const { teamId, targetPlan } = req.body;

    if (!teamId || !targetPlan) {
      return res.status(400).json({ error: 'teamId and targetPlan are required' });
    }

    if (targetPlan !== 'basic' && targetPlan !== 'pro') {
      return res.status(400).json({ error: 'targetPlan must be "basic" or "pro"' });
    }

    const priceId = targetPlan === 'basic' ? STRIPE_PRICE_BASIC : STRIPE_PRICE_PRO;

    if (!priceId) {
      return res.status(500).json({
        error: `Stripe price ID not configured for ${targetPlan} plan`
      });
    }

    // Create Stripe checkout session
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
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }

    const session = await stripeResponse.json();

    return res.status(200).json({ redirectUrl: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

