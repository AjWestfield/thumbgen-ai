import { NextRequest, NextResponse } from 'next/server';
import { stripe, getTierFromPriceId, TIERS, TierName } from '@/lib/stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import Stripe from 'stripe';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    console.error('[Webhook] No signature provided');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Payment failed for invoice ${invoice.id}`);
        // Could send notification to user here
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const clerkUserId = session.metadata?.clerkUserId;
  const tier = session.metadata?.tier as TierName;
  const billingCycle = session.metadata?.billingCycle as 'monthly' | 'annual';

  console.log('[Webhook] checkout.session.completed received:', {
    sessionId: session.id,
    clerkUserId,
    tier,
    billingCycle,
    customerId: session.customer,
    subscriptionId: session.subscription,
  });

  if (!clerkUserId || !tier || !billingCycle) {
    console.error('[Webhook] Missing metadata in checkout session:', session.metadata);
    throw new Error(`Missing required metadata: clerkUserId=${clerkUserId}, tier=${tier}, billingCycle=${billingCycle}`);
  }

  // Retrieve subscription details
  console.log('[Webhook] Retrieving subscription:', session.subscription);
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string) as Stripe.Subscription;
  console.log('[Webhook] Subscription retrieved:', subscription.id, subscription.status);

  // Get customer email
  console.log('[Webhook] Retrieving customer:', session.customer);
  const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer;
  const email = customer.email || session.customer_email || '';
  console.log('[Webhook] Customer email:', email);

  const credits = TIERS[tier].credits;
  console.log(`[Webhook] Tier ${tier} = ${credits} credits`);

  // Get current period end from subscription items
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000);

  const userData = {
    clerkUserId,
    email,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    tier,
    billingCycle,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    credits,
    creditsPerMonth: credits,
  };

  console.log('[Webhook] Calling Convex createUserFromWebhook with:', userData);

  try {
    const result = await convex.mutation(api.users.createUserFromWebhook, userData);
    console.log('[Webhook] Convex mutation result:', result);
    console.log(`[Webhook] SUCCESS: User ${clerkUserId} activated with ${tier} plan (${credits} credits)`);
  } catch (convexError) {
    console.error('[Webhook] CRITICAL: Convex mutation failed:', convexError);
    console.error('[Webhook] User data that failed:', userData);
    throw convexError; // Re-throw to mark webhook as failed
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerkUserId;

  if (!clerkUserId) {
    console.error('[Webhook] No clerkUserId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tierInfo = getTierFromPriceId(priceId);

  if (!tierInfo) {
    console.error('[Webhook] Unknown price ID:', priceId);
    return;
  }

  const credits = TIERS[tierInfo.tier].credits;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000);

  await convex.mutation(api.users.updateSubscription, {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    tier: tierInfo.tier,
    billingCycle: tierInfo.billingCycle,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    credits,
    creditsPerMonth: credits,
  });

  console.log(`[Webhook] Subscription updated for user ${clerkUserId}: ${tierInfo.tier}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeCustomerId = subscription.customer as string;

  await convex.mutation(api.users.cancelSubscription, {
    stripeCustomerId,
  });

  console.log(`[Webhook] Subscription canceled for customer ${stripeCustomerId}`);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // This fires on renewal - reset credits to full allocation
  if (invoice.billing_reason === 'subscription_cycle') {
    // Get subscription ID from invoice lines (first subscription item)
    const subscriptionId = invoice.lines?.data?.[0]?.subscription as string | undefined;

    if (!subscriptionId) {
      console.error('[Webhook] No subscription ID found in invoice');
      return;
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    const priceId = subscription.items.data[0]?.price.id;
    const tierInfo = getTierFromPriceId(priceId);

    if (tierInfo) {
      const credits = TIERS[tierInfo.tier].credits;

      await convex.mutation(api.users.addCredits, {
        stripeCustomerId: invoice.customer as string,
        credits,
      });

      console.log(`[Webhook] Credits renewed: ${credits} for customer ${invoice.customer}`);
    }
  }
}
