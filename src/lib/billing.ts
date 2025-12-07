/**
 * Billing service for Stripe integration
 * Handles checkout session creation and billing portal access
 */

export interface CheckoutSessionResponse {
  redirectUrl: string;
}

export interface BillingError {
  error: string;
}

class BillingService {
  /**
   * Create a Stripe checkout session for upgrading/changing plan
   */
  async createCheckoutSession(teamId: string, targetPlan: 'basic' | 'pro'): Promise<string> {
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamId,
          targetPlan,
        }),
      });

      if (!response.ok) {
        const error: BillingError = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const data: CheckoutSessionResponse = await response.json();
      return data.redirectUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Check if Stripe is configured
   */
  async isStripeConfigured(): Promise<boolean> {
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'OPTIONS',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const billingService = new BillingService();

