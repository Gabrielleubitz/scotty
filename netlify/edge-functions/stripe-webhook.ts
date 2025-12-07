/**
 * Netlify Edge Function for Stripe webhooks
 * For Vercel, this should be converted to an API route in api/webhooks/stripe.ts
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, doc, updateDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Firebase (you'll need to pass config via env vars)
function getFirestoreInstance() {
  const firebaseConfig = {
    projectId: Deno.env.get('FIREBASE_PROJECT_ID'),
    // Add other Firebase config as needed
  };
  
  const app = initializeApp(firebaseConfig);
  return getFirestore(app);
}

export default async (request: Request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify webhook signature
    // Note: In production, use Stripe's webhook signature verification
    // For Deno, you'd need to implement the verification logic
    // For now, we'll parse the event directly (not recommended for production)
    
    const event = JSON.parse(body);

    const db = getFirestoreInstance();
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const teamId = session.metadata?.teamId;
        const targetPlan = session.metadata?.targetPlan;
        const customerId = session.customer;

        if (teamId && customerId) {
          const teamRef = doc(db, 'teams', teamId);
          await updateDoc(teamRef, {
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

        // Find team by customer ID
        // Note: In production, you'd want to store a mapping or use metadata
        // For now, we'll need to query teams by billingCustomerId
        // This is a simplified version - you may need to adjust based on your setup
        
        if (customerId) {
          // You'll need to query Firestore to find the team
          // For now, we'll log and handle in a more complete implementation
          console.log('Subscription updated for customer:', customerId);
          
          const status = subscription.status;
          const plan = subscription.items.data[0]?.price?.metadata?.plan || 'basic';
          
          // Update logic would go here
          // You'd need to query teams collection where billingCustomerId == customerId
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        if (customerId) {
          // Find and update team
          // Similar to above, query teams and update
          console.log('Subscription deleted for customer:', customerId);
          // Update team subscription status to 'canceled'
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

