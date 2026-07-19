"use client";

import { useMemo, useState, useTransition } from "react";
import { FaMagnifyingGlass, FaRobot, FaGavel, FaListCheck } from "react-icons/fa6";
import { submitReviewDecision, type ReviewDecision } from "@/app/legal/legal-review/actions";

export interface RecommendedSection {
  act_code: string;
  section_number: string;
  title?: string;
  relevance_reason?: string;
}

export interface CaseLawRef {
  case_title: string;
  court?: string;
  bail_outcome?: string;
  relevance_reason?: string;
}

export interface LegalRequest {
  id: string;
  caseId: string | null;
  complaintId: string | null;
  caseNumber: string | null;
  title: string;
  complaintSummary: string;
  caseStatus: string | null;
  district: string | null;
  policeStation: string | null;
  firNo: string | null;
  generatedAt: string | null;
  modelUsed: string | null;
  createdBy: string | null;
  suggestedPath: string[];
  recommendedSections: RecommendedSection[];
  caseLawRefs: CaseLawRef[];
  officerFeedback: string | null; // null = awaiting review
  officerFeedbackNotes: string | null;
}

const ACT_BADGE_STYLE: Record<string, string> = {
  BNS: "bg-maroon-50 text-maroon-800 border border-maroon-200",
  BNSS: "bg-gold-50 text-gold-700 border border-gold-300",
  BSA: "bg-stone-100 text-stone-700 border border-stone-300",
};

const FEEDBACK_LABEL: Record<string, string> = {
  accepted: "Accepted",
  rejected: "Rejected",
  needs_more_info: "Needs More Info",
};

export default function LegalReviewClient({ requests: initialRequests }: { requests: LegalRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRequests.find((r) => r.officerFeedback === null)?.id ?? initialRequests[0]?.id ?? null
  );
  const [opinion, setOpinion] = useState("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (r) =>
        (r.caseNumber ?? "").toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.firNo ?? "").toLowerCase().includes(q)
    );
  }, [requests, query]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  function submit(decision: ReviewDecision) {
    if (!selected) return;
    startTransition(async () => {
      await submitReviewDecision(selected.id, selected.caseId, decision, opinion);
      setRequests((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, officerFeedback: decision, officerFeedbackNotes: opinion || r.officerFeedbackNotes } : r))
      );
      setOpinion("");
    });
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Request list */}
      <div className="col-span-4">
        <div className="relative mb-3">
          <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by case no., FIR no., or title"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400"
          />
        </div>

        <div className="space-y-2">
          {filteredRequests.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedId(r.id);
                setOpinion("");
              }}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedId === r.id
                  ? "bg-maroon-800 border-maroon-800 text-ivory"
                  : "bg-white border-gold-200 hover:border-gold-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-semibold ${selectedId === r.id ? "text-gold-300" : "text-maroon-700"}`}>
                  {r.caseNumber ?? r.caseId ?? "No case number"}
                </span>
                <StatusPill feedback={r.officerFeedback} inverted={selectedId === r.id} />
              </div>
              <p className={`text-sm font-medium mt-1 ${selectedId === r.id ? "text-ivory" : "text-gray-900"}`}>
                {r.title}
              </p>
              <p className={`text-xs mt-1 ${selectedId === r.id ? "text-ivory/70" : "text-gray-400"}`}>
                {r.firNo ? `FIR ${r.firNo} · ` : ""}
                {r.generatedAt ?? ""}
              </p>
            </button>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-10 bg-white border border-gold-200 rounded-lg">
              No requests match your search.
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="col-span-8">
        {!selected ? (
          <div className="bg-white border border-gold-200 rounded-lg p-16 text-center text-sm text-gray-500">
            Select a legal request from the list to begin review.
          </div>
        ) : (
          <div className="bg-white border border-gold-200 rounded-lg shadow-sm">
            <div className="p-5 border-b border-gold-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
                <StatusPill feedback={selected.officerFeedback} />
              </div>
              {selected.complaintSummary && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selected.complaintSummary}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {[selected.caseNumber, selected.firNo ? `FIR ${selected.firNo}` : null, selected.policeStation, selected.district]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {selected.modelUsed && (
                <p className="text-xs text-gray-400 mt-1">
                  Generated by {selected.modelUsed}
                  {selected.generatedAt ? ` on ${selected.generatedAt}` : ""}
                </p>
              )}
            </div>

            {/* Suggested investigation path */}
            {selected.suggestedPath.length > 0 && (
              <div className="p-5 border-b border-gold-100">
                <div className="flex items-center gap-2 mb-3">
                  <FaListCheck className="text-maroon-700" />
                  <h3 className="text-sm font-semibold text-maroon-800 uppercase tracking-wide">
                    Suggested Investigation Path
                  </h3>
                </div>
                <ul className="space-y-1.5 list-disc list-inside text-sm text-gray-700">
                  {selected.suggestedPath.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI suggested sections — read-only, one verdict covers all of them */}
            <div className="p-5 border-b border-gold-100">
              <div className="flex items-center gap-2 mb-3">
                <FaRobot className="text-maroon-700" />
                <h3 className="text-sm font-semibold text-maroon-800 uppercase tracking-wide">AI Suggested Sections</h3>
              </div>

              {selected.recommendedSections.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No sections were recommended for this case.</p>
              ) : (
                <div className="space-y-3">
                  {selected.recommendedSections.map((s, i) => (
                    <div key={i} className="border border-gray-200 rounded-md p-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${ACT_BADGE_STYLE[s.act_code] ?? "bg-gray-100 text-gray-700 border border-gray-200"}`}>
                        {s.act_code} §{s.section_number}
                      </span>
                      {s.title && <p className="text-sm font-semibold text-gray-900 mt-1.5">{s.title}</p>}
                      {s.relevance_reason && <p className="text-xs text-gray-600 mt-1">{s.relevance_reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Case law references — read-only */}
            {selected.caseLawRefs.length > 0 && (
              <div className="p-5 border-b border-gold-100">
                <div className="flex items-center gap-2 mb-3">
                  <FaGavel className="text-maroon-700" />
                  <h3 className="text-sm font-semibold text-maroon-800 uppercase tracking-wide">Case Law References</h3>
                </div>
                <div className="space-y-2">
                  {selected.caseLawRefs.map((c, i) => (
                    <div key={i} className="border border-gray-100 rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">{c.case_title}</p>
                        {c.bail_outcome && <span className="text-xs text-gray-400">{c.bail_outcome}</span>}
                      </div>
                      {c.court && <p className="text-xs text-gray-500 mt-0.5">{c.court}</p>}
                      {c.relevance_reason && <p className="text-xs text-gray-600 mt-1">{c.relevance_reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal opinion + final verdict */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-maroon-800 uppercase tracking-wide mb-2">Legal Opinion</h3>

              {selected.officerFeedback === null ? (
                <>
                  <textarea
                    value={opinion}
                    onChange={(e) => setOpinion(e.target.value)}
                    rows={4}
                    placeholder="Add your legal opinion, notes on section applicability, or reasons for the decision..."
                    className="w-full border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400 resize-none"
                  />

                  <div className="flex items-center justify-end gap-3 mt-4">
                    <button
                      disabled={isPending}
                      onClick={() => submit("needs_more_info")}
                      className="px-4 py-2 rounded-md text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Needs More Info
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => submit("rejected")}
                      className="px-4 py-2 rounded-md text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => submit("accepted")}
                      className="px-4 py-2 rounded-md text-sm font-semibold bg-maroon-800 text-gold-200 hover:bg-maroon-700 disabled:opacity-50"
                    >
                      Approve &amp; Clear
                    </button>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 italic">
                    This request has already been marked{" "}
                    <span className="font-semibold not-italic">{FEEDBACK_LABEL[selected.officerFeedback] ?? selected.officerFeedback}</span>.
                  </p>
                  {selected.officerFeedbackNotes && (
                    <div className="mt-3 border border-gray-100 rounded-md p-3 bg-gray-50">
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Recorded Legal Opinion</p>
                      <p className="text-sm text-gray-700">{selected.officerFeedbackNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ feedback, inverted }: { feedback: string | null; inverted?: boolean }) {
  if (feedback === null) {
    return (
      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${inverted ? "bg-gold-500/20 text-gold-200" : "bg-gold-50 text-gold-700 border border-gold-300"}`}>
        Pending Review
      </span>
    );
  }
  const style =
    feedback === "accepted"
      ? inverted
        ? "bg-emerald-500/20 text-emerald-200"
        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : feedback === "rejected"
      ? inverted
        ? "bg-red-500/20 text-red-200"
        : "bg-red-50 text-red-700 border border-red-200"
      : inverted
      ? "bg-gray-500/20 text-gray-200"
      : "bg-gray-50 text-gray-600 border border-gray-200";

  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${style}`}>{FEEDBACK_LABEL[feedback] ?? feedback}</span>;
}