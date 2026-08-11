"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";

// ---------- Types ----------

interface CrossReference {
  act: string;
  section: string;
  subject?: string | null;
  summary_of_comparison?: string | null;
}

interface LegalSection {
  id: string;
  act_code: string;
  section_number: string;
  title?: string;
  section_text?: string;
  category?: string;
  similarity: number;
  reason: string;
  cross_references: CrossReference[];
}

interface LandmarkJudgment {
  id: string;
  case_title: string;
  court?: string;
  case_date?: string | null;
  ipc_sections?: string;
  crime_type?: string;
  summary?: string;
  judgment_reason?: string;
  bail_outcome?: string;
  similarity: number;
  reason: string;
}

interface AnalysisResult {
  complaint_id: string;
  case_summary: string;
  sections: LegalSection[];
  judgments: LandmarkJudgment[];
}

const SECTION_TEXT_PREVIEW_LENGTH = 260;

// Adjust to wherever your FastAPI backend is served
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
// NOTE: set NEXT_PUBLIC_API_BASE_URL to the bare host (e.g. http://localhost:8000),
// without a trailing /api — the /api prefix is already part of the fetch paths below,
// matching the router's prefix="/api/complaints" in legal_section_intelligence.py.

// ---------- Small presentational helpers ----------

function SimilarityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    pct >= 75
      ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
      : pct >= 50
      ? "bg-amber-50 text-amber-700 ring-amber-600/20"
      : "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {pct}% match
    </span>
  );
}

function ActBadge({ act }: { act: string }) {
  const isNewAct = ["BNS", "BNSS", "BSA"].includes(act);
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide ${
        isNewAct ? "bg-maroon-900 text-gold-300" : "bg-slate-200 text-slate-700"
      }`}
    >
      {act}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-gold-200 bg-white p-5">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-full rounded bg-slate-100" />
      <div className="mt-2 h-3 w-2/3 rounded bg-slate-100" />
    </div>
  );
}

// ---------- Page ----------

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
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [caseSummaryDraft, setCaseSummaryDraft] = useState("");
  const [needsManualSummary, setNeedsManualSummary] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set());
  const [selectedJudgmentIds, setSelectedJudgmentIds] = useState<Set<string>>(new Set());

  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // 1. Fetch existing analysis on component mount (Read-Only)
const fetchExistingAnalysis = useCallback(async () => {
  if (!complaintId) return;
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/legal-sections`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 404) {
      // No existing analysis stored yet — offer manual entry or run initial analysis
      setNeedsManualSummary(true);
      setLoading(false);
      return;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? data.detail ?? "Failed to load saved legal sections.");

    setResult(data);
    setCaseSummaryDraft(data.case_summary ?? "");
    setNeedsManualSummary(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Error loading saved data.");
  } finally {
    setLoading(false);
  }
}, [complaintId]);

// 2. Re-analyze triggered ONLY by user action (Mutates/Updates DB Row)
const runAnalysis = useCallback(
  async (summaryOverride?: string) => {
    if (!complaintId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/legal-sections/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_summary: summaryOverride || null }),
      });

      if (res.status === 422) {
        setNeedsManualSummary(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.detail ?? "Request failed.");

      setResult(data);
      setCaseSummaryDraft(data.case_summary ?? "");
      setNeedsManualSummary(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  },
  [complaintId]
);

// Run GET request on initial mount
useEffect(() => {
  if (complaintId) fetchExistingAnalysis();
}, [complaintId, fetchExistingAnalysis]);
  function toggleSectionText(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSectionSelect(id: string) {
    setSelectedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleJudgmentSelect(id: string) {
    setSelectedJudgmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedSections = result?.sections.filter((s) => selectedSectionIds.has(s.id)) ?? [];
  const selectedJudgments = result?.judgments.filter((j) => selectedJudgmentIds.has(j.id)) ?? [];
  const selectedCount = selectedSections.length + selectedJudgments.length;

  async function handleSaveDraft() {
    if (!result || !complaintId) return;
    setSavingDraft(true);
    setError(null);
    try {
      const payload = {
        complaint_id: complaintId,
        crime_category: selectedSections[0]?.category || null,
        summary: caseSummaryDraft,
        draft_content: {
          selected_sections: selectedSections,
          selected_judgments: selectedJudgments,
        },
      };

      const res = await fetch(`${API_BASE}/api/fir-drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail ?? data?.error ?? "Request failed.");

      setDraftId(data.data?.id ?? data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save FIR draft.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleDownloadDraft() {
    if (!draftId) return;
    setDownloadError(null);
    try {
      const res = await fetch(`${API_BASE}/api/fir-drafts/${draftId}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? data?.error ?? "Request failed.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `fir_draft_${draftId}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Failed to download DOCX.");
    }
  }

  return (
    <DashboardLayout>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-6xl">
          <Link
            href={`/ai-assistant`}
            className="text-sm font-medium text-maroon-700 hover:text-maroon-900"
          >
            ← Back to Case Assistant
          </Link>

          <div className="mt-3 mb-6">
            <h1 className="text-2xl font-semibold text-ink-900">Relevant Legal Sections</h1>
            <p className="mt-1 text-sm text-ink-500">Case {caseId}</p>
            <p className="mt-2 text-sm text-ink-600">
              BNS/BNSS/BSA and IPC/CrPC/IEA sections matched to this complaint&apos;s facts, with related case
              law. Select what applies and draft the FIR directly from here.
            </p>
          </div>

          {!complaintId && (
            <p className="rounded-lg border border-gold-200 bg-white p-5 text-sm text-ink-600">
              No complaint is linked to this case yet, so legal sections can&apos;t be suggested. Link a
              complaint to this case first, then come back here.
            </p>
          )}

          {complaintId && loading && !result && (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {error && (
            <p className="mb-4 rounded-md border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm text-risk">
              {error}
            </p>
          )}

          {draftId && (
            <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              FIR draft saved. You can download it from the panel on the right.
            </p>
          )}

          {downloadError && (
            <p className="mb-4 rounded-md border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm text-risk">
              {downloadError}
            </p>
          )}

          {complaintId && result && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Main column */}
              <div className="space-y-6">
                {/* Applicable sections */}
                <div>
                  <h2 className="text-sm font-medium text-ink-900">
                    Applicable sections {result.sections.length > 0 ? `(${result.sections.length})` : ""}
                  </h2>
                  {result.sections.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-500">
                      {needsManualSummary
                        ? "Waiting on a case summary."
                        : "No clearly applicable sections were found."}
                    </p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      {result.sections.map((section) => {
                        const isExpanded = expandedSections.has(section.id);
                        const text = section.section_text || "";
                        const isLong = text.length > SECTION_TEXT_PREVIEW_LENGTH;
                        const shown =
                          isExpanded || !isLong ? text : text.slice(0, SECTION_TEXT_PREVIEW_LENGTH) + "…";
                        const isSelected = selectedSectionIds.has(section.id);

                        return (
                          <div
                            key={section.id}
                            className={`rounded-lg border-2 p-5 ${
                              isSelected ? "border-gold-500 bg-white ring-2 ring-gold-200" : "border-gold-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <ActBadge act={section.act_code} />
                                <span className="font-medium text-ink-900">
                                  Sec {section.section_number}
                                  {section.title ? ` — ${section.title}` : ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <SimilarityBadge score={section.similarity} />
                                <label className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSectionSelect(section.id)}
                                  />
                                  Select
                                </label>
                              </div>
                            </div>

                            {section.category && (
                              <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                                {section.category}
                              </span>
                            )}

                            {text && (
                              <div className="mt-2 text-sm text-ink-600">
                                {shown}
                                {isLong && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSectionText(section.id)}
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
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {section.cross_references.map((ref, i) => (
                                    <span
                                      key={i}
                                      title={ref.summary_of_comparison ?? undefined}
                                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                                    >
                                      <ActBadge act={ref.act} />
                                      Sec {ref.section}
                                      {ref.subject ? ` · ${ref.subject}` : ""}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Judgments */}
                <div>
                  <h2 className="text-sm font-medium text-ink-900">
                    Related case law {result.judgments.length > 0 ? `(${result.judgments.length})` : ""}
                  </h2>
                  {result.judgments.length === 0 ? (
                    <p className="mt-2 text-sm text-ink-500">
                      {needsManualSummary ? "Waiting on a case summary." : "No closely related judgments were found."}
                    </p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      {result.judgments.map((judgment) => {
                        const isSelected = selectedJudgmentIds.has(judgment.id);
                        const outcome = judgment.bail_outcome?.toLowerCase() ?? "";
                        const outcomeTone = outcome.includes("grant")
                          ? "bg-emerald-50 text-emerald-700"
                          : outcome.includes("den") || outcome.includes("reject")
                          ? "bg-rose-50 text-rose-700"
                          : "bg-slate-100 text-slate-600";

                        return (
                          <div
                            key={judgment.id}
                            className={`rounded-lg border-2 p-5 ${
                              isSelected ? "border-gold-500 bg-white ring-2 ring-gold-200" : "border-gold-200 bg-white"
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <span className="font-medium text-ink-900">{judgment.case_title}</span>
                                <p className="text-xs text-ink-500">
                                  {[judgment.court, judgment.case_date].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <SimilarityBadge score={judgment.similarity} />
                                <label className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleJudgmentSelect(judgment.id)}
                                  />
                                  Select
                                </label>
                              </div>
                            </div>

                            {judgment.summary && <p className="mt-2 text-sm text-ink-600">{judgment.summary}</p>}
                            {judgment.judgment_reason && (
                              <p className="mt-1 text-sm text-ink-600">{judgment.judgment_reason}</p>
                            )}
                            <p className="mt-2 text-xs text-ink-500">Why this applies: {judgment.reason}</p>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {judgment.ipc_sections && (
                                <span className="rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
                                  IPC {judgment.ipc_sections}
                                </span>
                              )}
                              {judgment.bail_outcome && (
                                <span className={`rounded-md px-2 py-1 text-xs font-medium ${outcomeTone}`}>
                                  {judgment.bail_outcome}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right rail: case summary + FIR drafting */}
              <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
                <div className="rounded-lg border border-gold-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-ink-900">Case summary used for this analysis</h3>
                  <p className="mt-1 text-xs text-ink-500">
                    Edit this if it&apos;s missing something important, then re-analyze.
                  </p>
                  <textarea
                    value={caseSummaryDraft}
                    onChange={(e) => setCaseSummaryDraft(e.target.value)}
                    rows={4}
                    placeholder="Describe the incident (who, what, where, how)…"
                    className="mt-2 w-full rounded-md border border-gold-200 px-3 py-2 text-sm text-ink-700
                               focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
                  />
                  {needsManualSummary && (
                    <p className="mt-2 text-xs text-amber-700">
                      No stored summary found for this complaint — enter one above to analyze.
                    </p>
                  )}
                  <button
  type="button"
  onClick={() => runAnalysis(caseSummaryDraft)}
  disabled={loading || !caseSummaryDraft.trim()}
  className="mt-3 w-full rounded-md border border-gold-300 bg-white px-4 py-2 text-sm text-ink-900 hover:bg-gold-50 disabled:opacity-60 transition-colors"
>
  {loading ? "Re-analyzing…" : "Re-analyze with this summary"}
</button>
                </div>

                <div className="rounded-lg border border-gold-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-ink-900">Draft FIR</h3>
                  <p className="mt-1 text-xs text-ink-500">
                    {selectedCount} item{selectedCount === 1 ? "" : "s"} selected
                    {selectedSections.length > 0 || selectedJudgments.length > 0
                      ? ` (${selectedSections.length} section${selectedSections.length === 1 ? "" : "s"}, ${
                          selectedJudgments.length
                        } judgment${selectedJudgments.length === 1 ? "" : "s"})`
                      : ""}
                  </p>

                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || selectedCount === 0}
                    className="mt-3 w-full rounded-md bg-maroon-700 px-4 py-2 text-sm font-medium text-white
                               hover:bg-maroon-800 disabled:opacity-60 transition-colors"
                  >
                    {savingDraft ? "Saving draft…" : "Save FIR draft"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDraft}
                    disabled={!draftId}
                    className="mt-2 w-full rounded-md border border-gold-300 bg-white px-4 py-2 text-sm text-ink-900
                               hover:bg-gold-50 disabled:opacity-60 transition-colors"
                  >
                    Download DOCX
                  </button>
                </div>
              </aside>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}