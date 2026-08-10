"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";

interface CrossReference {
  act: string;
  section: string;
  subject?: string;
  summary_of_comparison?: string;
}

interface LegalSectionResult {
  id: string;
  act_code: string;
  section_number: string;
  title?: string;
  section_text?: string;
  category?: string;
  reason: string;
  cross_references: CrossReference[];
}

interface JudgmentResult {
  id: string;
  case_title: string;
  court?: string;
  case_date?: string | null;
  ipc_sections?: string;
  crime_type?: string;
  summary?: string;
  judgment_reason?: string;
  bail_outcome?: string;
  reason: string;
}

interface AnalyzeResponse {
  complaint_id: string;
  case_summary: string;
  sections: LegalSectionResult[];
  judgments: JudgmentResult[];
}

const SECTION_TEXT_PREVIEW_LENGTH = 260;

export default function LegalSectionsPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const searchParams = useSearchParams();
  const complaintId = searchParams.get("complaintId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [caseSummaryDraft, setCaseSummaryDraft] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  async function runAnalysis(override?: string) {
    if (!complaintId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/legal-sections/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(override ? { case_summary: override } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setResult(data);
      setCaseSummaryDraft(data.case_summary ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (complaintId) runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <DashboardLayout>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-3xl">
          <Link
            href={`/investigation/ai-assistant/${caseId}`}
            className="text-sm font-medium text-maroon-700 hover:text-maroon-900"
          >
            ← Back to Case Assistant
          </Link>

          <div className="mt-3 mb-6">
            <h1 className="text-2xl font-semibold text-ink-900">Relevant Legal Sections</h1>
            <p className="mt-1 text-sm text-ink-500">Case {caseId}</p>
            <p className="mt-2 text-sm text-ink-600">
              BNS/BNSS/BSA and IPC/CrPC/IEA sections matched to this complaint&apos;s facts, with related case law.
            </p>
          </div>

          {!complaintId && (
            <p className="rounded-lg border border-gold-200 bg-white p-5 text-sm text-ink-600">
              No complaint is linked to this case yet, so legal sections can&apos;t be suggested. Link a
              complaint to this case first, then come back here.
            </p>
          )}

          {complaintId && loading && !result && (
            <p className="rounded-lg border border-gold-200 bg-white p-5 text-sm text-ink-600">
              Analyzing case…
            </p>
          )}

          {error && (
            <p className="rounded-md border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm text-risk">
              {error}
            </p>
          )}

          {complaintId && result && (
            <div className="space-y-6">
              <div className="rounded-lg border border-gold-200 bg-white p-5">
                <h2 className="text-sm font-medium text-ink-900">Case summary used for this analysis</h2>
                <p className="mt-1 text-xs text-ink-500">
                  Edit this if it&apos;s missing something important, then re-analyze.
                </p>
                <textarea
                  value={caseSummaryDraft}
                  onChange={(e) => setCaseSummaryDraft(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-md border border-gold-200 px-3 py-2 text-sm text-ink-700
                             focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => runAnalysis(caseSummaryDraft)}
                  disabled={loading || !caseSummaryDraft.trim()}
                  className="mt-2 rounded-md border border-gold-300 bg-white px-4 py-2 text-sm text-ink-900
                             hover:bg-gold-50 disabled:opacity-60 transition-colors"
                >
                  {loading ? "Re-analyzing…" : "Re-analyze with this summary"}
                </button>
              </div>

              <div>
                <h2 className="text-sm font-medium text-ink-900">
                  Applicable sections {result.sections.length > 0 ? `(${result.sections.length})` : ""}
                </h2>
                {result.sections.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-500">No clearly applicable sections were found.</p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {result.sections.map((section) => {
                      const isExpanded = expandedSections.has(section.id);
                      const text = section.section_text || "";
                      const isLong = text.length > SECTION_TEXT_PREVIEW_LENGTH;
                      const shown =
                        isExpanded || !isLong ? text : text.slice(0, SECTION_TEXT_PREVIEW_LENGTH) + "…";

                      return (
                        <div key={section.id} className="rounded-lg border border-gold-200 bg-white p-5">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-medium text-ink-900">
                              {section.act_code} — Section {section.section_number}
                            </span>
                            {section.title && <span className="text-sm text-ink-700">{section.title}</span>}
                          </div>

                          {section.category && (
                            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                              {section.category}
                            </span>
                          )}

                          {text && (
                            <div className="mt-2 text-sm text-ink-600">
                              {shown}
                              {isLong && (
                                <button
                                  type="button"
                                  onClick={() => toggleSection(section.id)}
                                  className="ml-1 text-maroon-700 hover:text-maroon-900"
                                >
                                  {isExpanded ? "Show less" : "Show more"}
                                </button>
                              )}
                            </div>
                          )}

                          <p className="mt-2 text-xs text-ink-500">Why this applies: {section.reason}</p>

                          {section.cross_references.length > 0 && (
                            <div className="mt-3 border-t border-gold-100 pt-2">
                              <p className="text-xs font-medium text-ink-700">Equivalent under the other law:</p>
                              <ul className="mt-1 space-y-1 text-xs text-ink-500">
                                {section.cross_references.map((ref, i) => (
                                  <li key={i}>
                                    {ref.act} {ref.section}
                                    {ref.subject ? ` — ${ref.subject}` : ""}
                                    {ref.summary_of_comparison ? `: ${ref.summary_of_comparison}` : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-sm font-medium text-ink-900">
                  Related case law {result.judgments.length > 0 ? `(${result.judgments.length})` : ""}
                </h2>
                {result.judgments.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-500">No closely related judgments were found.</p>
                ) : (
                  <div className="mt-2 space-y-3">
                    {result.judgments.map((judgment) => (
                      <div key={judgment.id} className="rounded-lg border border-gold-200 bg-white p-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium text-ink-900">{judgment.case_title}</span>
                          {judgment.bail_outcome && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              {judgment.bail_outcome}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-500">
                          {[judgment.court, judgment.case_date].filter(Boolean).join(" · ")}
                        </p>
                        {judgment.summary && <p className="mt-2 text-sm text-ink-600">{judgment.summary}</p>}
                        {judgment.judgment_reason && (
                          <p className="mt-1 text-sm text-ink-600">{judgment.judgment_reason}</p>
                        )}
                        <p className="mt-2 text-xs text-ink-500">Why this applies: {judgment.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}