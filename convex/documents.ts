import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByProject = query({
  args: { projectId: v.id("grantProjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const upload = mutation({
  args: {
    projectId: v.id("grantProjects"),
    type: v.union(
      v.literal("writing_sample"),
      v.literal("draft_proposal"),
      v.literal("pilot_data"),
      v.literal("call_guidelines")
    ),
    fileName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    const docId = await ctx.db.insert("documents", {
      projectId: args.projectId,
      userId,
      type: args.type,
      fileName: args.fileName,
      content: args.content,
      uploadedAt: Date.now(),
    });

    const typeLabels: Record<string, string> = {
      writing_sample: "Writing Sample",
      draft_proposal: "Draft Proposal",
      pilot_data: "Pilot Data",
      call_guidelines: "Call Guidelines",
    };

    await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: `Uploaded ${typeLabels[args.type]}: ${args.fileName}`,
      type: "success",
      createdAt: Date.now(),
    });

    return docId;
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== userId) throw new Error("Not found");

    await ctx.db.delete(args.id);
  },
});
