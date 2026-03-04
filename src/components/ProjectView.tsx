import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useRef } from "react";
import { GrantPreview } from "./GrantPreview";
import { ReviewPanel } from "./ReviewPanel";

interface ProjectViewProps {
  projectId: Id<"grantProjects">;
  onBack: () => void;
}

export function ProjectView({ projectId, onBack }: ProjectViewProps) {
  const project = useQuery(api.projects.get, { id: projectId });
  const documents = useQuery(api.documents.listByProject, { projectId });
  const activities = useQuery(api.activity.listByProject, { projectId });
  const latestDraft = useQuery(api.grants.getLatestDraft, { projectId });
  const reviews = useQuery(api.reviews.getByDraft, latestDraft ? { draftId: latestDraft._id } : "skip");

  const uploadDocument = useMutation(api.documents.upload);
  const removeDocument = useMutation(api.documents.remove);
  const removeProject = useMutation(api.projects.remove);
  const synthesizeGrant = useMutation(api.synthesis.synthesizeGrant);
  const runPeerReview = useMutation(api.synthesis.runPeerReview);
  const generateFinal = useMutation(api.synthesis.generateFinalGrant);

  const [activeTab, setActiveTab] = useState<"upload" | "draft" | "review" | "final">("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<"writing_sample" | "draft_proposal" | "pilot_data" | "call_guidelines">("writing_sample");

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    await uploadDocument({
      projectId,
      type: uploadType,
      fileName: file.name,
      content,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSynthesize = async () => {
    setIsProcessing(true);
    try {
      const draftId = await synthesizeGrant({ projectId });
      setActiveTab("draft");
      // Run peer review after synthesis
      if (draftId) {
        await runPeerReview({ projectId, draftId });
        setActiveTab("review");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateFinal = async () => {
    if (!latestDraft) return;
    setIsProcessing(true);
    try {
      await generateFinal({ projectId, draftId: latestDraft._id });
      setActiveTab("final");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    await removeProject({ id: projectId });
    onBack();
  };

  type DocumentType = { _id: Id<"documents">; fileName: string; type: string };
  const docsByType = {
    writing_sample: documents?.filter((d: DocumentType) => d.type === "writing_sample") || [],
    draft_proposal: documents?.filter((d: DocumentType) => d.type === "draft_proposal") || [],
    pilot_data: documents?.filter((d: DocumentType) => d.type === "pilot_data") || [],
    call_guidelines: documents?.filter((d: DocumentType) => d.type === "call_guidelines") || [],
  };

  const canSynthesize = docsByType.draft_proposal.length > 0 && docsByType.call_guidelines.length > 0;
  const hasDraft = !!latestDraft;
  const hasReviews = reviews && reviews.length === 3;
  const isFinal = latestDraft?.isFinal;

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={onBack}
                className="flex-shrink-0 p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold truncate">{project.title}</h1>
                <StatusBadge status={project.status} />
              </div>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-shrink-0 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Delete Project?</h3>
            <p className="text-sm text-zinc-500 mb-6">This action cannot be undone. All documents, drafts, and reviews will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 p-1 bg-zinc-900/50 rounded-xl overflow-x-auto">
              {[
                { id: "upload", label: "Upload", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
                { id: "draft", label: "Draft", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                { id: "review", label: "Review", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                { id: "final", label: "Final", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-amber-500 text-black"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "upload" && (
              <div className="space-y-6">
                {/* Upload Area */}
                <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 sm:p-6">
                  <h3 className="font-semibold mb-4">Upload Documents</h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                    {[
                      { value: "writing_sample", label: "Writing Sample" },
                      { value: "draft_proposal", label: "Draft Proposal" },
                      { value: "pilot_data", label: "Pilot Data" },
                      { value: "call_guidelines", label: "Call Guidelines" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setUploadType(type.value as typeof uploadType)}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          uploadType === type.value
                            ? "bg-amber-500 text-black"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>

                  <label className="flex flex-col items-center justify-center h-32 sm:h-40 border-2 border-dashed border-zinc-700 hover:border-amber-500/50 rounded-xl cursor-pointer transition-colors">
                    <svg className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-zinc-500">Click to upload or drag and drop</span>
                    <span className="text-xs text-zinc-600 mt-1">.txt, .md, .doc files</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileUpload}
                      accept=".txt,.md,.doc,.docx"
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Document Lists */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DocumentList
                    title="Writing Samples"
                    docs={docsByType.writing_sample}
                    onRemove={(id) => removeDocument({ id })}
                    required={false}
                  />
                  <DocumentList
                    title="Draft Proposal"
                    docs={docsByType.draft_proposal}
                    onRemove={(id) => removeDocument({ id })}
                    required
                  />
                  <DocumentList
                    title="Pilot Data"
                    docs={docsByType.pilot_data}
                    onRemove={(id) => removeDocument({ id })}
                    required={false}
                  />
                  <DocumentList
                    title="Call Guidelines"
                    docs={docsByType.call_guidelines}
                    onRemove={(id) => removeDocument({ id })}
                    required
                  />
                </div>

                {/* Synthesize Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleSynthesize}
                    disabled={!canSynthesize || isProcessing}
                    className="flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                  >
                    {isProcessing ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Synthesize Grant
                      </>
                    )}
                  </button>
                </div>
                {!canSynthesize && (
                  <p className="text-center text-sm text-zinc-500">
                    Upload at least a draft proposal and call guidelines to begin synthesis.
                  </p>
                )}
              </div>
            )}

            {activeTab === "draft" && (
              <GrantPreview draft={latestDraft} title="Generated Draft" />
            )}

            {activeTab === "review" && (
              <div className="space-y-6">
                <ReviewPanel reviews={reviews || []} />

                {hasReviews && !isFinal && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleGenerateFinal}
                      disabled={isProcessing}
                      className="flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          Generate Final Grant
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "final" && (
              <GrantPreview
                draft={isFinal ? latestDraft : null}
                title="Final Fundable Grant"
                isFinal
              />
            )}
          </div>

          {/* Activity Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 sm:p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity
              </h3>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {activities === undefined ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-zinc-800/50 rounded-lg" />
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">
                    No activity yet. Start by uploading documents.
                  </p>
                ) : (
                  activities.map((activity: { _id: Id<"activityLog">; message: string; type: string; agentName?: string; createdAt: number }) => (
                    <ActivityItem key={activity._id} activity={activity} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "text-zinc-400" },
    uploading: { label: "Uploading", color: "text-blue-400" },
    synthesizing: { label: "Synthesizing...", color: "text-purple-400" },
    reviewing: { label: "Peer Review", color: "text-amber-400" },
    revising: { label: "Revising...", color: "text-orange-400" },
    complete: { label: "Complete", color: "text-emerald-400" },
  };
  const s = config[status] || config.draft;
  return <span className={`text-xs ${s.color}`}>{s.label}</span>;
}

function DocumentList({
  title,
  docs,
  onRemove,
  required
}: {
  title: string;
  docs: Array<{ _id: Id<"documents">; fileName: string }>;
  onRemove: (id: Id<"documents">) => void;
  required: boolean;
}) {
  return (
    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-300">{title}</h4>
        {required && docs.length === 0 && (
          <span className="text-[10px] text-amber-400 uppercase tracking-wider">Required</span>
        )}
        {docs.length > 0 && (
          <span className="text-xs text-emerald-400">✓</span>
        )}
      </div>

      {docs.length === 0 ? (
        <p className="text-xs text-zinc-600">No documents uploaded</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc._id} className="flex items-center justify-between gap-2 px-3 py-2 bg-black/30 rounded-lg">
              <span className="text-xs text-zinc-400 truncate">{doc.fileName}</span>
              <button
                onClick={() => onRemove(doc._id)}
                className="flex-shrink-0 p-1 text-zinc-600 hover:text-red-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityItem({ activity }: {
  activity: {
    message: string;
    type: string;
    agentName?: string;
    createdAt: number
  }
}) {
  const typeColors: Record<string, string> = {
    info: "border-zinc-700 bg-zinc-800/30",
    success: "border-emerald-500/30 bg-emerald-500/10",
    warning: "border-amber-500/30 bg-amber-500/10",
    agent: "border-purple-500/30 bg-purple-500/10",
  };

  const time = new Date(activity.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`p-3 rounded-lg border ${typeColors[activity.type] || typeColors.info}`}>
      {activity.agentName && (
        <span className="text-[10px] text-purple-400 uppercase tracking-wider font-medium">
          {activity.agentName}
        </span>
      )}
      <p className="text-xs text-zinc-300 leading-relaxed mt-1">{activity.message}</p>
      <span className="text-[10px] text-zinc-600 mt-2 block">{time}</span>
    </div>
  );
}
