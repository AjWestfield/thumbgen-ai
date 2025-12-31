import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// Helper function to ensure authentication
async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

// Save a new generated thumbnail (requires authentication)
export const saveThumbnail = mutation({
  args: {
    imageUrl: v.string(),
    prompt: v.string(),
    sourceImageUrl: v.optional(v.string()),
    referenceImageUrl: v.optional(v.string()),
    referenceType: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
    model: v.string(),
    aspectRatio: v.string(),
    resolution: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);

    return await ctx.db.insert("thumbnails", {
      ...args,
      userId: identity.subject, // Clerk user ID from JWT
      createdAt: Date.now(),
    });
  },
});

// Get current user's thumbnails (most recent first)
export const getUserThumbnails = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return []; // Return empty array for unauthenticated users
    }

    return await ctx.db
      .query("thumbnails")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

// Get all thumbnails (for backward compatibility - consider removing in production)
export const getAllThumbnails = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("thumbnails")
      .withIndex("by_created")
      .order("desc")
      .collect();
  },
});

// Get current user's thumbnail count
export const getThumbnailCount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const thumbnails = await ctx.db
      .query("thumbnails")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.subject))
      .collect();

    return thumbnails.length;
  },
});

// Delete a thumbnail (with ownership verification)
export const deleteThumbnail = mutation({
  args: { id: v.id("thumbnails") },
  handler: async (ctx, args) => {
    const identity = await getAuthenticatedUser(ctx);
    const thumbnail = await ctx.db.get(args.id);

    if (!thumbnail) {
      throw new Error("Thumbnail not found");
    }

    if (thumbnail.userId !== identity.subject) {
      throw new Error("Unauthorized: You can only delete your own thumbnails");
    }

    await ctx.db.delete(args.id);
  },
});
