import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByProject = query({
  args: { projectId: v.id("grantProjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("activityLog")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(50);
  },
});

export const add = mutation({
  args: {
    projectId: v.id("grantProjects"),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("agent")
    ),
    agentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: args.message,
      type: args.type,
      agentName: args.agentName,
      createdAt: Date.now(),
    });
  },
});
