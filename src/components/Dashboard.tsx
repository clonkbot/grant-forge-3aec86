import { useQuery, useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { ProjectView } from "./ProjectView";
import { Id } from "../../convex/_generated/dataModel";

export function Dashboard() {
  const { signOut } = useAuthActions();
  const projects = useQuery(api.projects.list);
  const createProject = useMutation(api.projects.create);
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"grantProjects"> | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    try {
      const id = await createProject({ title: newTitle.trim() });
      setSelectedProjectId(id);
      setNewTitle("");
      setShowNewProject(false);
    } finally {
      setIsCreating(false);
    }
  };

  if (selectedProjectId) {
    return (
      <ProjectView
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Grant<span className="text-amber-400">Forge</span>
            </h1>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-900/60 border border-zinc-800/50 p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8">
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Transform Research into
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent"> Funded Grants</span>
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base lg:text-lg max-w-2xl mb-6">
              Our multi-agent AI system synthesizes your research materials, generates compelling proposals, and runs rigorous peer review to maximize your funding success.
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Grant Project
            </button>
          </div>
        </div>

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-semibold mb-4">Create New Grant Project</h3>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter project title..."
                className="w-full px-4 py-3 bg-black/40 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewProject(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newTitle.trim() || isCreating}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-zinc-300 mb-4">Your Grant Projects</h3>

          {projects === undefined ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-zinc-900/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 sm:py-16 bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-2xl">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-zinc-800/50 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-zinc-400 mb-2">No projects yet</h4>
              <p className="text-sm text-zinc-600 max-w-sm mx-auto">
                Create your first grant project to start transforming your research into funded proposals.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: { _id: Id<"grantProjects">; title: string; status: string; createdAt: number; updatedAt: number }) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onClick={() => setSelectedProjectId(project._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-10 sm:mt-12">
          <h3 className="text-lg font-semibold text-zinc-300 mb-6">How GrantForge Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", title: "Upload Materials", desc: "Add your writing samples, draft proposal, pilot data, and call guidelines" },
              { step: "02", title: "AI Synthesis", desc: "Our main agent analyzes your materials and generates a comprehensive grant" },
              { step: "03", title: "Peer Review", desc: "Three expert AI reviewers critique and score your proposal" },
              { step: "04", title: "Final Grant", desc: "Revisions are incorporated to produce a fundable final version" },
            ].map((item, i) => (
              <div key={i} className="group relative bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 sm:p-6 hover:border-amber-500/30 transition-all">
                <span className="absolute top-4 right-4 text-4xl sm:text-5xl font-bold text-zinc-800/50 group-hover:text-amber-500/20 transition-colors">
                  {item.step}
                </span>
                <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ project, onClick }: {
  project: { _id: Id<"grantProjects">; title: string; status: string; createdAt: number; updatedAt: number };
  onClick: () => void
}) {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "text-zinc-400", bg: "bg-zinc-800" },
    uploading: { label: "Uploading", color: "text-blue-400", bg: "bg-blue-500/20" },
    synthesizing: { label: "Synthesizing", color: "text-purple-400", bg: "bg-purple-500/20" },
    reviewing: { label: "Peer Review", color: "text-amber-400", bg: "bg-amber-500/20" },
    revising: { label: "Revising", color: "text-orange-400", bg: "bg-orange-500/20" },
    complete: { label: "Complete", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  };

  const status = statusConfig[project.status] || statusConfig.draft;
  const date = new Date(project.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <button
      onClick={onClick}
      className="text-left w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 sm:p-6 hover:border-amber-500/30 hover:bg-zinc-900/70 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
          {status.label}
        </div>
        <svg className="w-5 h-5 text-zinc-600 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <h4 className="font-semibold text-white mb-2 line-clamp-2">{project.title}</h4>
      <p className="text-xs text-zinc-600">Updated {date}</p>
    </button>
  );
}
