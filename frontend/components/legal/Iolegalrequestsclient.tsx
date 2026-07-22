"use client";

// components/legal/IoLegalRequestsClient.tsx
import { useMemo, useState } from "react";

export type OfficerFeedback = "accepted" | "rejected" | "needs_more_info" | null;

export interface RecommendedSection {
  code?: string;
  act?: string;
  act_code?: string;
  section_number?: string;
  title?: string;
  relevance_reason?: string;
  [key: string]: unknown;
}

export interface IOLegalRequest {
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
  suggestedPath: string[];
  recommendedSections: RecommendedSection[];
  caseLawRefs: string[];
  officerFeedback: OfficerFeedback;
  officerFeedbackNotes: string | null;
}

type FilterKey = "all" | "pending" | "accepted" | "rejected" | "needs_more_info";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Awaiting Review" },
  { key: "accepted", label: "Approved" },
  { key: "needs_more_info", label: "Needs More Info" },
  { key: "rejected", label: "Rejected" },
];

function StatusBadge({ feedback }: { feedback: OfficerFeedback }) {
  const config = {
    accepted: { label: "Approved", cls: "bg-green-50 text-green-700 border-green-200" },
    rejected: { label: "Rejected", cls: "bg-maroon-50 text-risk border-maroon-200" },
    needs_more_info: { label: "Needs More Info", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    null: { label: "Awaiting Legal Review", cls: "bg-gray-50 text-gray-600 border-gray-200" },
  } as const;

  const c = config[feedback ?? "null"];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${c.cls}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          feedback === "accepted"
            ? "bg-green-500"
            : feedback === "rejected"
            ? "bg-maroon-600"
            : feedback === "needs_more_info"
            ? "bg-amber-500"
            : "bg-gray-400"
        }`}
      />
      {c.label}
    </span>
  );
}

function renderSection(s: RecommendedSection, i: number) {
  // Supports both shapes seen across the app: {code, act, title} and
  // {act_code, section_number, title, relevance_reason}
  const code = s.code ?? s.section_number;
  const act = s.act ?? s.act_code;
  const label = code ? `${code}${act ? ` (${act})` : ""}${s.title ? ` — ${s.title}` : ""}` : JSON.stringify(s);

  return (
    <li key={i}>
      {label}
      {s.relevance_reason && <div className="text-xs text-ink-500">{s.relevance_reason}</div>}
    </li>
  );
}

function RequestCard({ req }: { req: IOLegalRequest }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gold-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-ink-900">
            {req.title}
            {req.caseNumber && <span className="ml-2 text-sm font-normal text-ink-500">#{req.caseNumber}</span>}
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            {[req.district, req.policeStation, req.firNo ? `FIR ${req.firNo}` : null].filter(Boolean).join(" · ")}
          </p>
          {req.generatedAt && (
            <p className="mt-1 text-xs text-ink-400">Requested {req.generatedAt}</p>
          )}
        </div>
        <StatusBadge feedback={req.officerFeedback} />
      </div>

      {req.complaintSummary && (
        <p className="mt-3 text-sm text-ink-600 line-clamp-2">{req.complaintSummary}</p>
      )}

      {req.officerFeedback && (
        <div
          className={`mt-3 rounded-md border px-3 py-2 text-sm ${
            req.officerFeedback === "accepted"
              ? "border-green-200 bg-green-50 text-green-800"
              : req.officerFeedback === "rejected"
              ? "border-maroon-200 bg-maroon-50 text-maroon-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <span className="font-medium">Legal Advisor's note: </span>
          {req.officerFeedbackNotes?.trim() ? req.officerFeedbackNotes : "No additional notes were provided."}
        </div>
      )}

      {!req.officerFeedback && (
        <p className="mt-3 text-sm text-ink-500 italic">
          This request hasn't been reviewed by a Legal Advisor yet.
        </p>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-xs font-medium text-maroon-700 hover:text-maroon-900"
      >
        {expanded ? "Hide details" : "View suggested path & sections"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-4 border-t border-gold-100 pt-3">
          {!!req.suggestedPath?.length && (
            <div>
              <h4 className="text-sm font-medium text-ink-900">Suggested path</h4>
              <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-ink-600">
                {req.suggestedPath.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {!!req.recommendedSections?.length && (
            <div>
              <h4 className="text-sm font-medium text-ink-900">Recommended sections</h4>
              <ul className="mt-1 space-y-1 text-sm text-ink-600">
                {req.recommendedSections.map((s, i) => renderSection(s, i))}
              </ul>
            </div>
          )}

          {!!req.caseLawRefs?.length && (
            <div>
              <h4 className="text-sm font-medium text-ink-900">Case law references</h4>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-600">
                {req.caseLawRefs.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {req.modelUsed && (
            <p className="text-xs text-ink-400">Generated using {req.modelUsed}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function IoLegalRequestsClient({ requests }: { requests: IOLegalRequest[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: requests.length,
      pending: 0,
      accepted: 0,
      rejected: 0,
      needs_more_info: 0,
    };
    for (const r of requests) {
      if (!r.officerFeedback) c.pending++;
      else c[r.officerFeedback]++;
    }
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    if (filter === "pending") return requests.filter((r) => !r.officerFeedback);
    return requests.filter((r) => r.officerFeedback === filter);
  }, [requests, filter]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              filter === f.key
                ? "border-maroon-600 bg-maroon-600 text-white"
                : "border-gold-200 bg-white text-ink-700 hover:bg-gold-50"
            }`}
          >
            {f.label} <span className="ml-1 opacity-70">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gold-200 p-8 text-center text-sm text-ink-500">
          No requests match this filter.
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}