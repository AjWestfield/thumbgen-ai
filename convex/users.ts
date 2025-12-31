import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Credit cost per operation (10 credits = 1 thumbnail)
const CREDIT_COST = 10;

// Get or create user (called on first interaction)
export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (existingUser) {
      return existingUser;
    }

    // Create new user with 0 credits (must subscribe to generate)
    const newUserId = await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email: identity.email || "",
      credits: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.get(newUserId);
  },
});

// Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();
  },
});

// Get user by Clerk ID (for internal use)
export const getUserByClerkId = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();
  },
});

// Check if user has enough credits (uses auth context)
export const hasCredits = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasCredits: false, required: CREDIT_COST, available: 0, tier: null };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    const available = user?.credits || 0;

    return {
      hasCredits: available >= CREDIT_COST,
      required: CREDIT_COST,
      available,
      tier: user?.tier || null,
      subscriptionStatus: user?.subscriptionStatus || null,
    };
  },
});

// Check if user has enough credits (for API routes using ConvexHttpClient)
export const hasCreditsForUser = query({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    const available = user?.credits || 0;

    return {
      hasCredits: available >= CREDIT_COST,
      required: CREDIT_COST,
      available,
      tier: user?.tier || null,
      subscriptionStatus: user?.subscriptionStatus || null,
    };
  },
});

// Deduct credits (called after successful operation - uses auth context)
export const deductCredits = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < CREDIT_COST) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(user._id, {
      credits: user.credits - CREDIT_COST,
      updatedAt: Date.now(),
    });

    return { newBalance: user.credits - CREDIT_COST };
  },
});

// Deduct credits (for API routes using ConvexHttpClient)
export const deductCreditsForUser = mutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    if (user.credits < CREDIT_COST) {
      throw new Error("Insufficient credits");
    }

    await ctx.db.patch(user._id, {
      credits: user.credits - CREDIT_COST,
      updatedAt: Date.now(),
    });

    return { newBalance: user.credits - CREDIT_COST };
  },
});

// Mutation for creating user from webhook (called by Stripe webhook, protected by signature)
export const createUserFromWebhook = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    subscriptionStatus: v.string(),
    tier: v.string(),
    billingCycle: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    credits: v.number(),
    creditsPerMonth: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingUser) {
      // Update existing user - ADD new credits to existing credits (for upgrades)
      // This preserves unused credits when upgrading plans
      const newCredits = (existingUser.credits || 0) + args.credits;

      await ctx.db.patch(existingUser._id, {
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        subscriptionStatus: args.subscriptionStatus,
        tier: args.tier,
        billingCycle: args.billingCycle,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        credits: newCredits,
        creditsPerMonth: args.creditsPerMonth,
        creditsResetAt: Date.now(),
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      tier: args.tier,
      billingCycle: args.billingCycle,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      credits: args.credits,
      creditsPerMonth: args.creditsPerMonth,
      creditsResetAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mutation for updating subscription from webhook (called by Stripe webhook)
export const updateSubscription = mutation({
  args: {
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    subscriptionStatus: v.string(),
    tier: v.string(),
    billingCycle: v.string(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    credits: v.optional(v.number()),
    creditsPerMonth: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!user) {
      console.error("[Convex] User not found for Stripe customer:", args.stripeCustomerId);
      return;
    }

    const updateData: Record<string, unknown> = {
      stripeSubscriptionId: args.stripeSubscriptionId,
      subscriptionStatus: args.subscriptionStatus,
      tier: args.tier,
      billingCycle: args.billingCycle,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updatedAt: Date.now(),
    };

    if (args.credits !== undefined) {
      updateData.credits = args.credits;
    }
    if (args.creditsPerMonth !== undefined) {
      updateData.creditsPerMonth = args.creditsPerMonth;
    }

    await ctx.db.patch(user._id, updateData);
  },
});

// Mutation to add credits on subscription renewal (called by Stripe webhook)
export const addCredits = mutation({
  args: {
    stripeCustomerId: v.string(),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!user) {
      console.error("[Convex] User not found for Stripe customer:", args.stripeCustomerId);
      return;
    }

    await ctx.db.patch(user._id, {
      credits: args.credits, // Reset to full allocation (not additive)
      creditsResetAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Mutation to cancel subscription (called by Stripe webhook)
export const cancelSubscription = mutation({
  args: {
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer_id", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!user) {
      console.error("[Convex] User not found for Stripe customer:", args.stripeCustomerId);
      return;
    }

    await ctx.db.patch(user._id, {
      subscriptionStatus: "canceled",
      tier: undefined,
      billingCycle: undefined,
      creditsPerMonth: undefined,
      updatedAt: Date.now(),
    });
  },
});

// Get user's Stripe customer ID for portal
export const getStripeCustomerId = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
      .first();

    return user?.stripeCustomerId || null;
  },
});
