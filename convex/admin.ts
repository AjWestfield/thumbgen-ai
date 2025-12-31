/**
 * Admin functions for manual operations
 * These should only be used by administrators
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create or update a user with subscription (for fixing subscription issues)
export const createOrUpdateUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    credits: v.number(),
    tier: v.string(),
    billingCycle: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        credits: args.credits,
        tier: args.tier,
        creditsPerMonth: args.credits,
        subscriptionStatus: "active",
        billingCycle: args.billingCycle || "monthly",
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        updatedAt: Date.now(),
      });
      console.log(`Updated user ${args.email} with ${args.credits} credits (${args.tier} tier)`);
      return { success: true, userId: existingUser._id, action: "updated" };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      credits: args.credits,
      tier: args.tier,
      creditsPerMonth: args.credits,
      subscriptionStatus: "active",
      billingCycle: args.billingCycle || "monthly",
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`Created user ${args.email} with ${args.credits} credits (${args.tier} tier)`);
    return { success: true, userId, action: "created" };
  },
});

// Grant credits to a user by email (for fixing subscription issues)
export const grantCredits = mutation({
  args: {
    email: v.string(),
    credits: v.number(),
    tier: v.string(),
    billingCycle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error(`User not found with email: ${args.email}`);
    }

    // Update user with credits and subscription info
    await ctx.db.patch(user._id, {
      credits: args.credits,
      tier: args.tier,
      creditsPerMonth: args.credits,
      subscriptionStatus: "active",
      billingCycle: args.billingCycle || "monthly",
      updatedAt: Date.now(),
    });

    console.log(`Granted ${args.credits} credits to ${args.email} (${args.tier} tier)`);
    return { success: true, userId: user._id, newCredits: args.credits };
  },
});

// Get user by email (for debugging)
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// List all users (for debugging)
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Debug auth - check what identity info is available
export const debugAuth = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { authenticated: false, error: "No identity found" };
    }
    return {
      authenticated: true,
      subject: identity.subject,
      issuer: identity.issuer,
      email: identity.email,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});
