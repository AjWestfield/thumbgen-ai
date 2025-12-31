import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, TIERS, TierName } from '@/lib/stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import Stripe from 'stripe';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    // Verify the session belongs to this user
    if (session.metadata?.clerkUserId !== userId) {
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const tier = session.metadata?.tier as TierName;
    const billingCycle = session.metadata?.billingCycle as 'monthly' | 'annual';

    if (!tier || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing subscription metadata' },
        { status: 400 }
      );
    }

    const subscription = session.subscription as Stripe.Subscription;
    const customer = session.customer as Stripe.Customer;
    const credits = TIERS[tier].credits;
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000);

    console.log(`[Verify Session] Activating subscription for user ${userId}: ${tier} (${credits} credits)`);

    // Grant credits to the user
    // Extract customer ID - when expanded, session.customer is the full object
    const stripeCustomerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer).id;

    await convex.mutation(api.users.createUserFromWebhook, {
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
    });

    return NextResponse.json({
      success: true,
      tier,
      credits,
      message: `Successfully activated ${tier} plan with ${credits} credits`,
    });
  } catch (error) {
    console.error('[Verify Session] Error:', error);

    if (error instanceof Error) {
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
