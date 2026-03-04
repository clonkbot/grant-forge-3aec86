import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("grantProjects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("grantProjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId) return null;
    return project;
  },
});

export const create = mutation({
  args: { title: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const projectId = await ctx.db.insert("grantProjects", {
      userId,
      title: args.title,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      projectId,
      message: "Grant project created. Ready for document uploads.",
      type: "info",
      createdAt: Date.now(),
    });

    return projectId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("grantProjects"),
    status: v.union(
      v.literal("draft"),
      v.literal("uploading"),
      v.literal("synthesizing"),
      v.literal("reviewing"),
      v.literal("revising"),
      v.literal("complete")
    )
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId) throw new Error("Not found");

    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("grantProjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== userId) throw new Error("Not found");

    // Delete all related documents
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }

    // Delete all drafts
    const drafts = await ctx.db
      .query("grantDrafts")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const draft of drafts) {
      // Delete reviews for this draft
      const reviews = await ctx.db
        .query("peerReviews")
        .withIndex("by_draft", (q) => q.eq("draftId", draft._id))
        .collect();
      for (const review of reviews) {
        await ctx.db.delete(review._id);
      }
      await ctx.db.delete(draft._id);
    }

    // Delete activity log
    const activities = await ctx.db
      .query("activityLog")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    await ctx.db.delete(args.id);
  },
});
