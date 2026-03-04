import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getDraftsByProject = query({
  args: { projectId: v.id("grantProjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("grantDrafts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

export const getLatestDraft = query({
  args: { projectId: v.id("grantProjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const drafts = await ctx.db
      .query("grantDrafts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(1);

    return drafts[0] || null;
  },
});

export const createDraft = mutation({
  args: {
    projectId: v.id("grantProjects"),
    content: v.string(),
    specificAims: v.optional(v.string()),
    significance: v.optional(v.string()),
    innovation: v.optional(v.string()),
    approach: v.optional(v.string()),
    timeline: v.optional(v.string()),
    budget: v.optional(v.string()),
    isFinal: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    // Get current version count
    const existingDrafts = await ctx.db
      .query("grantDrafts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const version = existingDrafts.length + 1;

    const draftId = await ctx.db.insert("grantDrafts", {
      projectId: args.projectId,
      version,
      content: args.content,
      specificAims: args.specificAims,
      significance: args.significance,
      innovation: args.innovation,
      approach: args.approach,
      timeline: args.timeline,
      budget: args.budget,
      createdAt: Date.now(),
      isFinal: args.isFinal,
    });

    await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: args.isFinal
        ? `Final grant version ${version} generated!`
        : `Grant draft version ${version} synthesized`,
      type: args.isFinal ? "success" : "info",
      agentName: "Grant Writer",
      createdAt: Date.now(),
    });

    return draftId;
  },
});
