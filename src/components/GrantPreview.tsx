interface GrantDraft {
  _id: string;
  version: number;
  content: string;
  specificAims?: string;
  significance?: string;
  innovation?: string;
  approach?: string;
  timeline?: string;
  budget?: string;
  createdAt: number;
  isFinal: boolean;
}

interface GrantPreviewProps {
  draft: GrantDraft | null | undefined;
  title: string;
  isFinal?: boolean;
}

export function GrantPreview({ draft, title, isFinal }: GrantPreviewProps) {
  if (!draft) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-zinc-800/50 rounded-2xl flex items-center justify-center">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-zinc-400 mb-2">
          {isFinal ? "No final grant yet" : "No draft generated yet"}
        </h4>
        <p className="text-sm text-zinc-600 max-w-sm mx-auto">
          {isFinal
            ? "Complete the peer review process to generate the final fundable grant."
            : "Upload your documents and click 'Synthesize Grant' to generate a draft."}
        </p>
      </div>
    );
  }

  const sections = [
    { key: "specificAims", title: "Specific Aims", content: draft.specificAims },
    { key: "significance", title: "Significance", content: draft.significance },
    { key: "innovation", title: "Innovation", content: draft.innovation },
    { key: "approach", title: "Research Approach", content: draft.approach },
    { key: "timeline", title: "Timeline", content: draft.timeline },
    { key: "budget", title: "Budget Justification", content: draft.budget },
  ].filter(s => s.content);

  const date = new Date(draft.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-2xl p-5 sm:p-6 border ${
        isFinal
          ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/30"
          : "bg-zinc-900/50 border-zinc-800/50"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isFinal && (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-full">
                  FINAL
                </span>
              )}
              <span className="text-xs text-zinc-500">Version {draft.version}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
            <p className="text-sm text-zinc-500 mt-1">{date}</p>
          </div>

          <button
            onClick={() => {
              const content = sections.map(s => `${s.title}\n\n${s.content}`).join('\n\n---\n\n');
              navigator.clipboard.writeText(content);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy All
          </button>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 sm:p-6">
        <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Overview</h4>
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{draft.content}</p>
      </div>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.key} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/50">
            <h4 className="font-semibold flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                section.key === "specificAims" ? "bg-amber-400" :
                section.key === "significance" ? "bg-blue-400" :
                section.key === "innovation" ? "bg-purple-400" :
                section.key === "approach" ? "bg-emerald-400" :
                section.key === "timeline" ? "bg-orange-400" :
                "bg-pink-400"
              }`} />
              {section.title}
            </h4>
          </div>
          <div className="px-5 sm:px-6 py-5">
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {section.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
