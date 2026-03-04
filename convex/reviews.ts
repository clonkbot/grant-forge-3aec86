import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByDraft = query({
  args: { draftId: v.id("grantDrafts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("peerReviews")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();
  },
});

export const create = mutation({
  args: {
    projectId: v.id("grantProjects"),
    draftId: v.id("grantDrafts"),
    reviewerNumber: v.number(),
    reviewerPersona: v.string(),
    overallScore: v.number(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    suggestions: v.array(v.string()),
    detailedCritique: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const reviewId = await ctx.db.insert("peerReviews", {
      projectId: args.projectId,
      draftId: args.draftId,
      reviewerNumber: args.reviewerNumber,
      reviewerPersona: args.reviewerPersona,
      overallScore: args.overallScore,
      strengths: args.strengths,
      weaknesses: args.weaknesses,
      suggestions: args.suggestions,
      detailedCritique: args.detailedCritique,
      createdAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: `Peer review ${args.reviewerNumber}/3 complete (Score: ${args.overallScore}/10)`,
      type: "agent",
      agentName: args.reviewerPersona,
      createdAt: Date.now(),
    });

    return reviewId;
  },
});
