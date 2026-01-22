/**
 * Stripe Client Configuration
 */
import Stripe from "stripe";
import { ENV } from "../_core/env";

// Initialize Stripe client (optional)
const stripeKey = ENV.stripeSecretKey;
if (!stripeKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY is not set. Payment features will be disabled.");
}

export const stripe = stripeKey 
  ? new Stripe(stripeKey, { apiVersion: "2025-12-15.clover" as any })
  : null as any;

const ensureStripe = () => {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }
  return stripe;
};

// Helper to get or create Stripe customer
export async function getOrCreateStripeCustomer(
  userId: number,
  email: string,
  name?: string | null,
  existingCustomerId?: string | null
): Promise<string> {
  // If customer already exists, return it
  if (existingCustomerId) {
    try {
      const customer = await ensureStripe().customers.retrieve(existingCustomerId);
      if (!customer.deleted) {
        return existingCustomerId;
      }
    } catch (error) {
      // Customer doesn't exist, create new one
    }
  }

  // Create new customer
  const customer = await ensureStripe().customers.create({
    email,
    name: name || undefined,
    metadata: {
      user_id: userId.toString(),
    },
  });

  return customer.id;
}

// Create a checkout session for subscription
export async function createSubscriptionCheckout(params: {
  customerId: string;
  creatorId: number;
  creatorUsername: string;
  priceInCents: number;
  userId: number;
  userEmail: string;
  userName?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await ensureStripe().checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Assinatura - @${params.creatorUsername}`,
            description: `Acesso ao conteúdo exclusivo de @${params.creatorUsername}`,
          },
          unit_amount: params.priceInCents,
          recurring: {
            interval: "month",
          },
        },
        quantity: 1,
      },
    ],
    client_reference_id: params.userId.toString(),
    metadata: {
      type: "subscription",
      user_id: params.userId.toString(),
      creator_id: params.creatorId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName || "",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url || "";
}

// Create a checkout session for PPV purchase
export async function createPPVCheckout(params: {
  customerId: string;
  postId: number;
  creatorUsername: string;
  priceInCents: number;
  userId: number;
  userEmail: string;
  userName?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await ensureStripe().checkout.sessions.create({
    customer: params.customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Conteúdo PPV - @${params.creatorUsername}`,
            description: `Acesso permanente ao conteúdo exclusivo`,
          },
          unit_amount: params.priceInCents,
        },
        quantity: 1,
      },
    ],
    client_reference_id: params.userId.toString(),
    metadata: {
      type: "ppv",
      user_id: params.userId.toString(),
      post_id: params.postId.toString(),
      customer_email: params.userEmail,
      customer_name: params.userName || "",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session.url || "";
}

// Create a checkout session for tip
export async function createTipCheckout(params: {
  customerId: string;
  creatorId: number;
  creatorUsername: string;
  amountInCents: number;
  postId?: number;
  message?: string;
  userId: number;
  userEmail: string;
  userName?: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const session = await ensureStripe().checkout.sessions.create({
    customer: params.customerId,
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: `Gorjeta para @${params.creatorUsername}`,
            description: params.message || "Obrigado pelo seu apoio!",
          },
          unit_amount: params.amountInCents,
        },
        quantity: 1,
      },
    ],
    client_reference_id: params.userId.toString(),
    metadata: {
      type: "tip",
      user_id: params.userId.toString(),
      creator_id: params.creatorId.toString(),
      post_id: params.postId?.toString() || "",
      message: params.message || "",
      customer_email: params.userEmail,
      customer_name: params.userName || "",
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session.url || "";
}

// Cancel a subscription
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await ensureStripe().subscriptions.cancel(subscriptionId);
}

// Get subscription details
export async function getSubscription(subscriptionId: string) {
  return ensureStripe().subscriptions.retrieve(subscriptionId);
}
