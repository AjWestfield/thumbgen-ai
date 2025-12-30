import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  thumbnails: defineTable({
    userId: v.optional(v.string()), // Clerk user ID from JWT (optional for legacy data)
    imageUrl: v.string(),
    prompt: v.string(),
    sourceImageUrl: v.optional(v.string()),
    referenceImageUrl: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    createdAt: v.number(),
    model: v.string(),
    aspectRatio: v.string(),
    resolution: v.string(),
  })
    .index("by_created", ["createdAt"])
    .index("by_user", ["userId"])
    .index("by_user_created", ["userId", "createdAt"]),

  // Users table for subscription and credit tracking
  users: defineTable({
    clerkUserId: v.string(), // Clerk user ID (subject from JWT)
    email: v.string(),

    // Stripe subscription fields
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.optional(v.string()), // 'active', 'canceled', 'past_due', 'trialing', null
    tier: v.optional(v.string()), // 'essential', 'premium', 'ultimate', null (free)
    billingCycle: v.optional(v.string()), // 'monthly', 'annual'
    currentPeriodEnd: v.optional(v.number()), // Unix timestamp
    cancelAtPeriodEnd: v.optional(v.boolean()),

    // Credits system
    credits: v.number(), // Current available credits
    creditsPerMonth: v.optional(v.number()), // Credits allocated per billing period
    creditsResetAt: v.optional(v.number()), // When credits were last reset

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_email", ["email"]),
});
