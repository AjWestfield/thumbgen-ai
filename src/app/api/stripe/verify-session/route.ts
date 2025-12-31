import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, TIERS, TierName } from '@/lib/stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import Stripe from 'stripe';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    console.log('[Verify Session] Starting session verification...');

    const { userId } = await auth();
    console.log('[Verify Session] Auth userId:', userId);

    if (!userId) {
      console.log('[Verify Session] No userId - unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;
    console.log('[Verify Session] Session ID:', sessionId);

    if (!sessionId) {
      console.log('[Verify Session] Missing session ID');
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    console.log('[Verify Session] Retrieving checkout session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
    console.log('[Verify Session] Session retrieved:', {
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      metadata: session.metadata,
    });

    // Verify the session belongs to this user
    if (session.metadata?.clerkUserId !== userId) {
      console.log('[Verify Session] User mismatch:', { sessionUserId: session.metadata?.clerkUserId, currentUserId: userId });
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      console.log('[Verify Session] Payment not completed:', session.payment_status);
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const tier = session.metadata?.tier as TierName;
    const billingCycle = session.metadata?.billingCycle as 'monthly' | 'annual';

    if (!tier || !billingCycle) {
      console.log('[Verify Session] Missing tier/billingCycle:', { tier, billingCycle });
      return NextResponse.json(
        { error: 'Missing subscription metadata' },
        { status: 400 }
      );
    }

    const subscription = session.subscription as Stripe.Subscription;
    const customer = session.customer as Stripe.Customer;
    const credits = TIERS[tier].credits;
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000);

    console.log(`[Verify Session] Processing: user=${userId}, tier=${tier}, credits=${credits}`);

    // Extract customer ID - when expanded, session.customer is the full object
    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer).id;

    const userData = {
      clerkUserId: userId,
      email: customer.email || '',
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      tier,
      billingCycle,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      credits,
      creditsPerMonth: credits,
    };

    console.log('[Verify Session] Calling Convex createUserFromWebhook with:', userData);

    try {
      const result = await convex.mutation(api.users.createUserFromWebhook, userData);
      console.log('[Verify Session] Convex mutation result:', result);
    } catch (convexError) {
      console.error('[Verify Session] CRITICAL: Convex mutation failed:', convexError);
      throw convexError;
    }

    console.log(`[Verify Session] SUCCESS: ${tier} plan activated with ${credits} credits`);

    return NextResponse.json({
      success: true,
      tier,
      credits,
      message: `Successfully activated ${tier} plan with ${credits} credits`,
    });
  } catch (error) {
    console.error('[Verify Session] Error:', error);

    if (error instanceof Error) {
      console.error('[Verify Session] Error message:', error.message);
      console.error('[Verify Session] Error stack:', error.stack);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
