import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe, getPriceId, TierName } from '@/lib/stripe';

interface CheckoutRequest {
  tier: TierName;
  billingCycle: 'monthly' | 'annual';
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to subscribe' },
        { status: 401 }
      );
    }

    const body: CheckoutRequest = await request.json();
    const { tier, billingCycle } = body;

    if (!tier || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing tier or billingCycle' },
        { status: 400 }
      );
    }

    // Validate tier
    if (!['essential', 'premium', 'ultimate'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    const priceId = getPriceId(tier, billingCycle);

    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe prices not configured. Please set up products in Stripe Dashboard.' },
        { status: 500 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/my-thumbnails?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
      metadata: {
        clerkUserId: userId,
        tier,
        billingCycle,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
          tier,
          billingCycle,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    console.error('[Stripe] Checkout error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
