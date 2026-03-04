interface PeerReview {
  _id: string;
  reviewerNumber: number;
  reviewerPersona: string;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  detailedCritique: string;
  createdAt: number;
}

interface ReviewPanelProps {
  reviews: PeerReview[];
}

export function ReviewPanel({ reviews }: ReviewPanelProps) {
  if (reviews.length === 0) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 sm:p-8 text-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-zinc-800/50 rounded-2xl flex items-center justify-center">
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h4 className="text-lg font-medium text-zinc-400 mb-2">No reviews yet</h4>
        <p className="text-sm text-zinc-600 max-w-sm mx-auto">
          Generate a draft first, then our AI peer reviewers will provide detailed feedback.
        </p>
      </div>
    );
  }

  const averageScore = reviews.reduce((sum, r) => sum + r.overallScore, 0) / reviews.length;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 6) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-emerald-500/20 border-emerald-500/30";
    if (score >= 6) return "bg-amber-500/20 border-amber-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Peer Review Summary</h3>
            <p className="text-sm text-zinc-500">{reviews.length} reviews completed</p>
          </div>
          <div className={`px-5 py-3 rounded-xl border ${getScoreBg(averageScore)} text-center`}>
            <div className={`text-2xl sm:text-3xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}
            </div>
            <div className="text-xs text-zinc-500">Average Score</div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {reviews.map((review) => (
            <div key={review._id} className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(review.overallScore)}`}>
                {review.overallScore}
              </div>
              <div className="text-[10px] text-zinc-500 truncate mt-1">
                Reviewer {review.reviewerNumber}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Individual Reviews */}
      {reviews.map((review) => (
        <ReviewCard key={review._id} review={review} />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: PeerReview }) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-400 bg-emerald-500/20";
    if (score >= 6) return "text-amber-400 bg-amber-500/20";
    return "text-red-400 bg-red-500/20";
  };

  const reviewerColors = [
    "from-blue-500/20 to-blue-500/5 border-blue-500/30",
    "from-purple-500/20 to-purple-500/5 border-purple-500/30",
    "from-pink-500/20 to-pink-500/5 border-pink-500/30",
  ];

  return (
    <div className={`bg-gradient-to-br ${reviewerColors[review.reviewerNumber - 1]} border rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
              {review.reviewerNumber}
            </div>
            <span className="text-xs text-zinc-400 uppercase tracking-wider">Reviewer</span>
          </div>
          <h4 className="font-medium text-sm sm:text-base">{review.reviewerPersona}</h4>
        </div>
        <div className={`px-4 py-2 rounded-lg ${getScoreColor(review.overallScore)}`}>
          <span className="text-lg font-bold">{review.overallScore}</span>
          <span className="text-xs opacity-70">/10</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 sm:px-6 py-5 space-y-5">
        {/* Strengths */}
        <div>
          <h5 className="text-xs font-medium text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Strengths
          </h5>
          <ul className="space-y-1.5">
            {review.strengths.map((s, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div>
          <h5 className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Weaknesses
          </h5>
          <ul className="space-y-1.5">
            {review.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* Suggestions */}
        <div>
          <h5 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Suggestions
          </h5>
          <ul className="space-y-1.5">
            {review.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Detailed Critique */}
        <div className="pt-4 border-t border-white/5">
          <h5 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Detailed Critique
          </h5>
          <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
            {review.detailedCritique}
          </p>
        </div>
      </div>
    </div>
  );
}
