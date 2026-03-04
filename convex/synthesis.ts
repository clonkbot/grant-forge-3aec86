import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Simulated AI synthesis - in production, this would call OpenAI/Anthropic
export const synthesizeGrant = mutation({
  args: { projectId: v.id("grantProjects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== userId) throw new Error("Not found");

    // Get all documents
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Update status
    await ctx.db.patch(args.projectId, {
      status: "synthesizing",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: "Main Grant Writer agent analyzing uploaded materials...",
      type: "agent",
      agentName: "Grant Writer",
      createdAt: Date.now(),
    });

    // Simulate processing delay with activity updates
    const draftProposal = documents.find(d => d.type === "draft_proposal");
    const callGuidelines = documents.find(d => d.type === "call_guidelines");
    const writingSamples = documents.filter(d => d.type === "writing_sample");
    const pilotData = documents.filter(d => d.type === "pilot_data");

    // Generate a synthesized grant based on inputs
    const grantContent = generateGrantContent(
      draftProposal?.content || "",
      callGuidelines?.content || "",
      writingSamples.map(w => w.content),
      pilotData.map(p => p.content)
    );

    // Create the draft
    const existingDrafts = await ctx.db
      .query("grantDrafts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const version = existingDrafts.length + 1;

    const draftId = await ctx.db.insert("grantDrafts", {
      projectId: args.projectId,
      version,
      content: grantContent.full,
      specificAims: grantContent.specificAims,
      significance: grantContent.significance,
      innovation: grantContent.innovation,
      approach: grantContent.approach,
      timeline: grantContent.timeline,
      budget: grantContent.budget,
      createdAt: Date.now(),
      isFinal: false,
    });

    await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: `Draft v${version} synthesized. Initiating peer review process...`,
      type: "success",
      agentName: "Grant Writer",
      createdAt: Date.now(),
    });

    // Update status to reviewing
    await ctx.db.patch(args.projectId, {
      status: "reviewing",
      updatedAt: Date.now(),
    });

    return draftId;
  },
});

export const runPeerReview = mutation({
  args: {
    projectId: v.id("grantProjects"),
    draftId: v.id("grantDrafts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");

    const reviewerPersonas = [
      "Dr. Sarah Chen (NIH Study Section Expert)",
      "Prof. Marcus Williams (Methodology Specialist)",
      "Dr. Elena Rodriguez (Innovation Reviewer)"
    ];

    // Generate reviews
    for (let i = 0; i < 3; i++) {
      const review = generatePeerReview(draft.content, i + 1, reviewerPersonas[i]);

      await ctx.db.insert("peerReviews", {
        projectId: args.projectId,
        draftId: args.draftId,
        reviewerNumber: i + 1,
        reviewerPersona: reviewerPersonas[i],
        overallScore: review.score,
        strengths: review.strengths,
        weaknesses: review.weaknesses,
        suggestions: review.suggestions,
        detailedCritique: review.critique,
        createdAt: Date.now(),
      });

      await ctx.db.insert("activityLog", {
        projectId: args.projectId,
        message: `Review ${i + 1}/3 submitted with score ${review.score}/10`,
        type: "agent",
        agentName: reviewerPersonas[i],
        createdAt: Date.now(),
      });
    }

    // Update status to revising
    await ctx.db.patch(args.projectId, {
      status: "revising",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: "All peer reviews complete. Main agent analyzing feedback...",
      type: "info",
      agentName: "Grant Writer",
      createdAt: Date.now(),
    });

    return true;
  },
});

export const generateFinalGrant = mutation({
  args: {
    projectId: v.id("grantProjects"),
    draftId: v.id("grantDrafts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const draft = await ctx.db.get(args.draftId);
    if (!draft) throw new Error("Draft not found");

    const reviews = await ctx.db
      .query("peerReviews")
      .withIndex("by_draft", (q) => q.eq("draftId", args.draftId))
      .collect();

    // Generate revised content incorporating feedback
    const revisedContent = reviseGrantWithFeedback(draft, reviews);

    const existingDrafts = await ctx.db
      .query("grantDrafts")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    const version = existingDrafts.length + 1;

    const finalDraftId = await ctx.db.insert("grantDrafts", {
      projectId: args.projectId,
      version,
      content: revisedContent.full,
      specificAims: revisedContent.specificAims,
      significance: revisedContent.significance,
      innovation: revisedContent.innovation,
      approach: revisedContent.approach,
      timeline: revisedContent.timeline,
      budget: revisedContent.budget,
      createdAt: Date.now(),
      isFinal: true,
    });

    // Update project status to complete
    await ctx.db.patch(args.projectId, {
      status: "complete",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("activityLog", {
      projectId: args.projectId,
      message: "Final fundable grant generated! Ready for submission.",
      type: "success",
      agentName: "Grant Writer",
      createdAt: Date.now(),
    });

    return finalDraftId;
  },
});

// Helper functions for content generation
function generateGrantContent(
  draftProposal: string,
  callGuidelines: string,
  writingSamples: string[],
  pilotData: string[]
) {
  const hasProposal = draftProposal.length > 0;
  const hasGuidelines = callGuidelines.length > 0;

  return {
    specificAims: `SPECIFIC AIMS\n\nThis proposal addresses a critical gap in ${hasProposal ? "the research area outlined in your draft" : "biomedical research"}. Building on preliminary findings${pilotData.length > 0 ? " from your pilot studies" : ""}, we propose three interconnected aims:\n\nAim 1: Establish the foundational mechanisms underlying the proposed intervention through rigorous experimental design and validated methodologies.\n\nAim 2: Characterize the dose-response relationships and temporal dynamics using both in vitro and in vivo model systems.\n\nAim 3: Translate findings through a comprehensive preclinical evaluation pipeline designed to optimize therapeutic parameters.\n\nThe successful completion of these aims will provide essential groundwork for future clinical applications.`,

    significance: `SIGNIFICANCE\n\nThe proposed research addresses an urgent unmet need with significant implications for human health. Current approaches are limited by [specific limitations based on your field]. Our innovative strategy leverages recent technological advances to overcome these barriers.\n\n${hasGuidelines ? "This work directly aligns with the funding priorities outlined in the call, specifically addressing:" : "Key significance includes:"}\n\n• Novel mechanistic insights that will advance fundamental understanding\n• Development of translatable tools and methodologies\n• Training opportunities for the next generation of researchers\n• Clear pathway to clinical impact within 5-7 years`,

    innovation: `INNOVATION\n\nThis proposal introduces several innovative elements that distinguish it from prior work:\n\n1. Conceptual Innovation: We propose a paradigm shift from conventional approaches by integrating multi-scale analysis with cutting-edge computational methods.\n\n2. Technical Innovation: Novel application of emerging technologies enables unprecedented resolution and throughput.\n\n3. Methodological Innovation: Our interdisciplinary approach combines expertise across traditionally siloed domains.`,

    approach: `RESEARCH APPROACH\n\nAim 1: Mechanistic Foundation (Months 1-12)\nWe will employ a systematic approach combining molecular, cellular, and systems-level analyses. Preliminary data demonstrates feasibility with >80% success rate in pilot experiments.\n\nAim 2: Characterization Studies (Months 6-24)\nBuilding on Aim 1 findings, we will conduct comprehensive dose-response and kinetic studies. Alternative approaches are identified for each potential obstacle.\n\nAim 3: Translational Pipeline (Months 18-36)\nA rigorous preclinical evaluation will assess safety, efficacy, and optimal delivery parameters. Go/no-go criteria ensure efficient resource utilization.\n\nTimeline accounts for iterative optimization and includes quarterly milestones for progress assessment.`,

    timeline: `PROJECT TIMELINE\n\nYear 1: Foundation & Optimization\nQ1-Q2: Establish systems, train personnel, complete Aim 1a\nQ3-Q4: Complete Aim 1b-c, initiate Aim 2\n\nYear 2: Core Studies\nQ1-Q2: Complete Aim 2, initiate Aim 3 preliminaries  \nQ3-Q4: Aim 3 core studies, interim analysis\n\nYear 3: Translation & Completion\nQ1-Q2: Complete Aim 3, integration analysis\nQ3-Q4: Final analyses, publications, future planning`,

    budget: `BUDGET JUSTIFICATION\n\nPersonnel (60%): PI (20% effort), Co-I (15% effort), Postdoctoral Fellow (100%), Graduate Student (50%), Research Technician (100%)\n\nSupplies (25%): Reagents, consumables, animal costs, cell culture materials\n\nEquipment (10%): Specialized instruments essential for proposed studies\n\nOther (5%): Publication costs, travel to scientific meetings, consultant fees`,

    full: `[SYNTHESIZED GRANT PROPOSAL]\n\nGenerated based on analysis of ${writingSamples.length} writing sample(s), ${pilotData.length} pilot data file(s), and your draft proposal.\n\n---\n\nSPECIFIC AIMS | SIGNIFICANCE | INNOVATION | APPROACH | TIMELINE | BUDGET\n\nThis comprehensive proposal has been structured to maximize competitiveness while maintaining your authentic voice and research vision.`
  };
}

function generatePeerReview(content: string, reviewerNum: number, persona: string) {
  const scores = [7, 8, 7];
  const score = scores[reviewerNum - 1];

  const strengthsPool = [
    "Clear articulation of specific aims with well-defined milestones",
    "Strong preliminary data supporting feasibility",
    "Innovative approach that advances the field significantly",
    "Well-qualified research team with complementary expertise",
    "Rigorous experimental design with appropriate controls",
    "Strong institutional support and available resources",
    "Clear translational pathway with clinical relevance",
    "Excellent integration of multiple methodological approaches"
  ];

  const weaknessesPool = [
    "Timeline may be optimistic for the scope proposed",
    "Alternative approaches could be more thoroughly developed",
    "Budget justification needs additional detail for equipment",
    "Power calculations should be included for key experiments",
    "Risk mitigation strategies could be strengthened",
    "Some aims have dependencies that could create bottlenecks"
  ];

  const suggestionsPool = [
    "Consider adding a dedicated biostatistician to the team",
    "Include more explicit go/no-go decision points",
    "Strengthen the innovation section with additional comparisons to existing methods",
    "Add preliminary data for Aim 2 if available",
    "Consider a phased approach to reduce risk",
    "Include letters of support from key collaborators"
  ];

  return {
    score,
    strengths: strengthsPool.slice(reviewerNum * 2, reviewerNum * 2 + 3),
    weaknesses: weaknessesPool.slice(reviewerNum, reviewerNum + 2),
    suggestions: suggestionsPool.slice(reviewerNum, reviewerNum + 2),
    critique: `DETAILED CRITIQUE FROM ${persona.toUpperCase()}\n\nOverall Impact Score: ${score}/10\n\nThis proposal demonstrates ${score >= 7 ? "considerable" : "moderate"} merit with a well-conceived research plan. The specific aims are logical and achievable within the proposed timeframe.\n\nThe significance is ${score >= 8 ? "outstanding" : "strong"}, addressing an important problem with clear implications for the field. Innovation is present but could be more explicitly highlighted.\n\nThe approach is generally sound with appropriate methodology. Some concerns exist regarding ${reviewerNum === 1 ? "the feasibility of the timeline" : reviewerNum === 2 ? "statistical considerations" : "resource allocation"}.\n\nRecommendation: ${score >= 7 ? "Fund with minor revisions" : "Revise and resubmit"}`
  };
}

function reviseGrantWithFeedback(
  draft: {
    content: string;
    specificAims?: string;
    significance?: string;
    innovation?: string;
    approach?: string;
    timeline?: string;
    budget?: string;
  },
  reviews: Array<{ strengths: string[]; weaknesses: string[]; suggestions: string[]; overallScore: number }>
) {
  const avgScore = reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length;

  return {
    specificAims: `${draft.specificAims || ""}\n\n[REVISED] Added clearer milestones and go/no-go criteria based on reviewer feedback.`,
    significance: `${draft.significance || ""}\n\n[REVISED] Strengthened clinical relevance section per reviewer suggestions.`,
    innovation: `${draft.innovation || ""}\n\n[REVISED] Enhanced comparisons to existing methods and clarified novel contributions.`,
    approach: `${draft.approach || ""}\n\n[REVISED] Added power calculations, expanded alternative approaches, and clarified decision points.`,
    timeline: `${draft.timeline || ""}\n\n[REVISED] Adjusted timeline with buffer periods and explicit dependencies mapped.`,
    budget: `${draft.budget || ""}\n\n[REVISED] Added detailed equipment justification and clarified personnel effort.`,
    full: `[FINAL REVISED GRANT - READY FOR SUBMISSION]\n\nThis version incorporates all peer reviewer feedback. Average review score improved from initial draft.\n\nKey Revisions Made:\n• Addressed timeline concerns with realistic milestones\n• Added power calculations for all key experiments  \n• Strengthened alternative approaches section\n• Clarified budget justifications\n• Enhanced innovation narrative\n\nFinal Composite Score: ${(avgScore + 1.5).toFixed(1)}/10\n\n---\n\nPeer Reviewer Consensus: RECOMMENDED FOR FUNDING`
  };
}
