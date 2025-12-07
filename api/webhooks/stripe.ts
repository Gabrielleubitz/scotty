/**
 * Vercel serverless function for Stripe webhooks
 * Replaces Netlify edge function
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin
function getFirebaseAdmin() {
  if (getApps().length === 0) {
    let serviceAccount: any = null;
    
    // Try to get service account from environment variable (for Vercel/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    
    if (serviceAccount) {
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT not configured. Webhook may not work correctly.');
    }
  }
  return getFirestore();
}

// Configure Vercel to pass raw body for Stripe signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get raw body for signature verification
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    // Note: In production, you should use Stripe's webhook signature verification
    // For now, we'll parse the event directly
    // TODO: Add proper signature verification using stripe.webhooks.constructEvent()
    
    const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

    const db = getFirebaseAdmin();
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const teamId = session.metadata?.teamId;
        const targetPlan = session.metadata?.targetPlan;
        const customerId = session.customer;

        if (teamId && customerId) {
          const teamRef = db.collection('teams').doc(teamId);
          await teamRef.update({
            billingCustomerId: customerId,
            subscriptionStatus: 'active',
            subscriptionPlan: targetPlan || 'basic',
            plan: targetPlan || 'basic',
            subscriptionRenewsAt: session.subscription 
              ? Timestamp.fromMillis(session.subscription.current_period_end * 1000)
              : null,
            updatedAt: Timestamp.now(),
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (customerId) {
          // Find team by customer ID
          const teamsSnapshot = await db.collection('teams')
            .where('billingCustomerId', '==', customerId)
            .limit(1)
            .get();
          
          if (!teamsSnapshot.empty) {
            const teamRef = teamsSnapshot.docs[0].ref;
            const status = subscription.status;
            const plan = subscription.items.data[0]?.price?.metadata?.plan || 'basic';
            
            await teamRef.update({
              subscriptionStatus: status,
              subscriptionPlan: plan,
              plan: plan,
              subscriptionRenewsAt: subscription.current_period_end 
                ? Timestamp.fromMillis(subscription.current_period_end * 1000)
                : null,
              updatedAt: Timestamp.now(),
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (customerId) {
          const teamsSnapshot = await db.collection('teams')
            .where('billingCustomerId', '==', customerId)
            .limit(1)
            .get();
          
          if (!teamsSnapshot.empty) {
            const teamRef = teamsSnapshot.docs[0].ref;
            await teamRef.update({
              subscriptionStatus: 'canceled',
              updatedAt: Timestamp.now(),
            });
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

