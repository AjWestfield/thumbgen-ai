import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[Delete Account] Starting deletion for user: ${userId}`);

    // 1. Get user data from Convex to check for Stripe subscription
    const user = await convex.query(api.users.getUserByClerkId, {
      clerkUserId: userId,
    });

    // 2. Cancel Stripe subscription if exists
    if (user?.stripeSubscriptionId) {
      try {
        console.log(`[Delete Account] Canceling Stripe subscription: ${user.stripeSubscriptionId}`);
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        console.log(`[Delete Account] Stripe subscription canceled successfully`);
      } catch (stripeError) {
        // Log but don't fail - subscription might already be canceled
        console.error('[Delete Account] Stripe cancellation error (continuing):', stripeError);
      }
    }

    // 3. Delete user's data from Convex (thumbnails and user record)
    try {
      console.log(`[Delete Account] Deleting user data from Convex`);
      await convex.mutation(api.users.deleteUserAccount, {
        clerkUserId: userId,
      });
      console.log(`[Delete Account] Convex data deleted successfully`);
    } catch (convexError) {
      console.error('[Delete Account] Convex deletion error:', convexError);
      throw new Error('Failed to delete user data');
    }

    // 4. Delete user from Clerk (this must be last as it invalidates the session)
    try {
      console.log(`[Delete Account] Deleting user from Clerk`);
      const client = await clerkClient();
      await client.users.deleteUser(userId);
      console.log(`[Delete Account] Clerk user deleted successfully`);
    } catch (clerkError) {
      console.error('[Delete Account] Clerk deletion error:', clerkError);
      // Data is already deleted from Convex, so we should still return success
      // The user will be unable to sign in anyway
    }

    console.log(`[Delete Account] Account deletion completed for user: ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Delete Account] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
