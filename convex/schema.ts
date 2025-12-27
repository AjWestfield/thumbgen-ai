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
});
