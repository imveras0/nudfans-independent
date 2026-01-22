/**
 * Stripe Webhook Handler
 */
import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "./client";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { subscriptions, ppvPurchases, tips, transactions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { calculateFees } from "./products";
import { notifyOwner } from "../_core/notification";

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) return;

  const metadata = session.metadata || {};
  const type = metadata.type;
  const userId = parseInt(metadata.user_id || "0");

  console.log(`[Webhook] Processing checkout: type=${type}, userId=${userId}`);

  if (type === "subscription") {
    const creatorId = parseInt(metadata.creator_id || "0");
    const subscriptionId = session.subscription as string;
    
    // Get subscription details from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
    const priceInCents = stripeSubscription.items?.data?.[0]?.price?.unit_amount || 0;
    
    // Create subscription record
    await db.insert(subscriptions).values({
      subscriberId: userId,
      creatorId: creatorId,
      stripeSubscriptionId: subscriptionId,
      status: "active",
      currentPeriodStart: new Date((stripeSubscription.current_period_start || Date.now() / 1000) * 1000),
      currentPeriodEnd: new Date((stripeSubscription.current_period_end || Date.now() / 1000) * 1000),
      priceAtPurchase: (priceInCents / 100).toFixed(2),
    });

    // Calculate fees and create transaction
    const fees = calculateFees(priceInCents);
    await db.insert(transactions).values({
      creatorId: creatorId,
      userId: userId,
      type: "subscription",
      amount: (fees.total / 100).toFixed(2),
      platformFee: (fees.platformFee / 100).toFixed(2),
      creatorEarnings: (fees.creatorEarnings / 100).toFixed(2),
      stripePaymentId: session.payment_intent as string,
      status: "completed",
      metadata: { subscriptionId },
    });

    // Update creator earnings
    const updateQuery = `UPDATE creator_profiles SET totalEarnings = totalEarnings + ${(fees.creatorEarnings / 100).toFixed(2)} WHERE userId = ${creatorId}`;
    await db.execute(updateQuery);

    // Notify owner
    await notifyOwner({
      title: "Nova Assinatura",
      content: `Novo assinante! Valor: R$ ${(priceInCents / 100).toFixed(2)}`,
    });

  } else if (type === "ppv") {
    const postId = parseInt(metadata.post_id || "0");
    const amountInCents = session.amount_total || 0;
    
    // Create PPV purchase record
    await db.insert(ppvPurchases).values({
      buyerId: userId,
      postId: postId,
      stripePaymentIntentId: session.payment_intent as string,
      amount: (amountInCents / 100).toFixed(2),
      status: "completed",
    });

    // Get creator from post
    const postResult = await db.execute(`SELECT creatorId FROM posts WHERE id = ${postId}`);
    const creatorId = (postResult as any)[0]?.[0]?.creatorId;

    if (creatorId) {
      // Calculate fees and create transaction
      const fees = calculateFees(amountInCents);
      await db.insert(transactions).values({
        creatorId: creatorId,
        userId: userId,
        type: "ppv",
        amount: (fees.total / 100).toFixed(2),
        platformFee: (fees.platformFee / 100).toFixed(2),
        creatorEarnings: (fees.creatorEarnings / 100).toFixed(2),
        stripePaymentId: session.payment_intent as string,
        status: "completed",
        metadata: { postId },
      });

      // Update creator earnings
      const updateQuery = `UPDATE creator_profiles SET totalEarnings = totalEarnings + ${(fees.creatorEarnings / 100).toFixed(2)} WHERE userId = ${creatorId}`;
      await db.execute(updateQuery);
    }

  } else if (type === "tip") {
    const creatorId = parseInt(metadata.creator_id || "0");
    const postId = metadata.post_id ? parseInt(metadata.post_id) : null;
    const message = metadata.message || null;
    const amountInCents = session.amount_total || 0;
    
    // Create tip record
    await db.insert(tips).values({
      senderId: userId,
      creatorId: creatorId,
      postId: postId,
      amount: (amountInCents / 100).toFixed(2),
      stripePaymentIntentId: session.payment_intent as string,
      message: message,
      status: "completed",
    });

    // Calculate fees and create transaction
    const fees = calculateFees(amountInCents);
    await db.insert(transactions).values({
      creatorId: creatorId,
      userId: userId,
      type: "tip",
      amount: (fees.total / 100).toFixed(2),
      platformFee: (fees.platformFee / 100).toFixed(2),
      creatorEarnings: (fees.creatorEarnings / 100).toFixed(2),
      stripePaymentId: session.payment_intent as string,
      status: "completed",
      metadata: { postId, message },
    });

    // Update creator earnings
    const updateQuery = `UPDATE creator_profiles SET totalEarnings = totalEarnings + ${(fees.creatorEarnings / 100).toFixed(2)} WHERE userId = ${creatorId}`;
    await db.execute(updateQuery);

    // Notify owner for large tips
    if (amountInCents >= 5000) {
      await notifyOwner({
        title: "Gorjeta Recebida",
        content: `Gorjeta de R$ ${(amountInCents / 100).toFixed(2)} recebida!`,
      });
    }
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const db = await getDb();
  if (!db) return;

  const status = subscription.status === "active" ? "active" 
    : subscription.status === "past_due" ? "past_due"
    : subscription.status === "canceled" ? "canceled"
    : "expired";

  await db.update(subscriptions)
    .set({
      status: status,
      currentPeriodStart: new Date((subscription.current_period_start || Date.now() / 1000) * 1000),
      currentPeriodEnd: new Date((subscription.current_period_end || Date.now() / 1000) * 1000),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

async function handleSubscriptionDeleted(subscription: any) {
  const db = await getDb();
  if (!db) return;

  await db.update(subscriptions)
    .set({ status: "canceled" })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

async function handleInvoicePaid(invoice: any) {
  // Handle recurring subscription payments
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;
  
  if (subscriptionId) {
    const db = await getDb();
    if (!db) return;

    const amountInCents = invoice.amount_paid || 0;

    // Get subscription record
    const subResult = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);
    
    const sub = subResult[0];
    if (!sub) return;

    // Calculate fees and create transaction for renewal
    const fees = calculateFees(amountInCents);
    const paymentIntentId = typeof invoice.payment_intent === 'string'
      ? invoice.payment_intent
      : invoice.payment_intent?.id || '';
    
    await db.insert(transactions).values({
      creatorId: sub.creatorId,
      userId: sub.subscriberId,
      type: "subscription",
      amount: (fees.total / 100).toFixed(2),
      platformFee: (fees.platformFee / 100).toFixed(2),
      creatorEarnings: (fees.creatorEarnings / 100).toFixed(2),
      stripePaymentId: paymentIntentId,
      status: "completed",
      metadata: { subscriptionId, renewal: true },
    });

    // Update creator earnings
    const updateQuery = `UPDATE creator_profiles SET totalEarnings = totalEarnings + ${(fees.creatorEarnings / 100).toFixed(2)} WHERE userId = ${sub.creatorId}`;
    await db.execute(updateQuery);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;
    
  if (subscriptionId) {
    const db = await getDb();
    if (!db) return;

    await db.update(subscriptions)
      .set({ status: "past_due" })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  }
}
