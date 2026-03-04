import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Grant projects - the main container for a grant application
  grantProjects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("uploading"),
      v.literal("synthesizing"),
      v.literal("reviewing"),
      v.literal("revising"),
      v.literal("complete")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Uploaded documents for a grant project
  documents: defineTable({
    projectId: v.id("grantProjects"),
    userId: v.id("users"),
    type: v.union(
      v.literal("writing_sample"),
      v.literal("draft_proposal"),
      v.literal("pilot_data"),
      v.literal("call_guidelines")
    ),
    fileName: v.string(),
    content: v.string(),
    uploadedAt: v.number(),
  }).index("by_project", ["projectId"]),

  // Generated grant drafts
  grantDrafts: defineTable({
    projectId: v.id("grantProjects"),
    version: v.number(),
    content: v.string(),
    specificAims: v.optional(v.string()),
    significance: v.optional(v.string()),
    innovation: v.optional(v.string()),
    approach: v.optional(v.string()),
    timeline: v.optional(v.string()),
    budget: v.optional(v.string()),
    createdAt: v.number(),
    isFinal: v.boolean(),
  }).index("by_project", ["projectId"]),

  // Peer review reports from sub-agents
  peerReviews: defineTable({
    projectId: v.id("grantProjects"),
    draftId: v.id("grantDrafts"),
    reviewerNumber: v.number(), // 1, 2, or 3
    reviewerPersona: v.string(),
    overallScore: v.number(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    suggestions: v.array(v.string()),
    detailedCritique: v.string(),
    createdAt: v.number(),
  }).index("by_draft", ["draftId"]),

  // Activity log for real-time updates
  activityLog: defineTable({
    projectId: v.id("grantProjects"),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("agent")
    ),
    agentName: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_project", ["projectId"]),
});
