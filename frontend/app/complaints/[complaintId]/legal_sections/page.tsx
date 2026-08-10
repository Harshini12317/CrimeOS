'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Sidebar from '@/components/layout/legal/Sidebar';
import DashboardLayout from '@/app/dashboard/layout';
import IOSidebar from '@/components/layout/io/Sidebar';

// ---------- Types ----------

interface CrossReference {
  act: string;
  section: string;
  subject: string | null;
  summary_of_comparison: string | null;
}

interface LegalSection {
  id: string;
  act_code: string;
  section_number: string;
  title: string;
  section_text: string;
  category: string;
  similarity: number;
  reason: string;
  cross_references: CrossReference[];
}

interface LandmarkJudgment {
  id: string;
  case_title: string;
  court: string;
  case_date: string;
  ipc_sections: string;
  crime_type: string;
  summary: string;
  judgment_reason: string;
  bail_outcome: string;
  similarity: number;
  reason: string;
}

interface AnalysisResult {
  complaint_id: string;
  case_summary: string;
  sections: LegalSection[];
  judgments: LandmarkJudgment[];
}

// Adjust to wherever your FastAPI backend is served
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
// NOTE: set NEXT_PUBLIC_API_BASE_URL to the bare host (e.g. http://localhost:8000),
// without a trailing /api — the /api prefix is already part of the fetch path below,
// matching the router's `prefix="/api/complaints"` in legal_section_intelligence.py.

// ---------- Small presentational helpers ----------

function SimilarityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const tone =
    pct >= 75 ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    : pct >= 50 ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
    : 'bg-slate-100 text-slate-600 ring-slate-500/20';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {pct}% match
    </span>
  );
}

function ActBadge({ act }: { act: string }) {
  const isNewAct = ['BNS', 'BNSS', 'BSA'].includes(act);
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold tracking-wide ${
        isNewAct ? 'bg-red-900 text-amber-300' : 'bg-slate-200 text-slate-700'
      }`}
    >
      {act}
    </span>
  );
}

function SectionCard({ section, selected, onToggle }: { section: LegalSection; selected: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`rounded-lg border-2 p-4 shadow-sm ${selected ? 'border-amber-500 bg-white ring-2 ring-amber-200' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ActBadge act={section.act_code} />
          <h3 className="font-semibold text-slate-900">
            Sec {section.section_number} — {section.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <SimilarityBadge score={section.similarity} />
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <input type="checkbox" checked={selected} onChange={onToggle} />
            Select
          </label>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">{section.reason}</p>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-xs font-medium text-red-900 hover:text-red-950"
      >
        {expanded ? 'Hide section text' : 'Show section text'}
      </button>

      {expanded && (
        <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          {section.section_text}
        </p>
      )}

      {section.cross_references.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            Corresponds to
          </p>
          <div className="flex flex-wrap gap-2">
            {section.cross_references.map((xref, i) => (
              <span
                key={i}
                title={xref.summary_of_comparison ?? undefined}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
              >
                <ActBadge act={xref.act} />
                Sec {xref.section}
                {xref.subject ? ` · ${xref.subject}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JudgmentCard({ judgment, selected, onToggle }: { judgment: LandmarkJudgment; selected: boolean; onToggle: () => void }) {
  const outcomeTone =
    judgment.bail_outcome?.toLowerCase().includes('grant')
      ? 'bg-emerald-50 text-emerald-700'
      : judgment.bail_outcome?.toLowerCase().includes('den') || judgment.bail_outcome?.toLowerCase().includes('reject')
      ? 'bg-rose-50 text-rose-700'
      : 'bg-slate-100 text-slate-600';

  return (
    <div className={`rounded-lg border-2 p-4 shadow-sm ${selected ? 'border-amber-500 bg-white ring-2 ring-amber-200' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{judgment.case_title}</h3>
          <p className="text-xs text-slate-500">
            {judgment.court} · {judgment.case_date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SimilarityBadge score={judgment.similarity} />
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm">
            <input type="checkbox" checked={selected} onChange={onToggle} />
            Select
          </label>
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-600">{judgment.reason}</p>

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
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
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
  params: Promise<{ complaintId: string }>;
}) {
  const { complaintId } = use(params);

  const [caseSummary, setCaseSummary] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsManualSummary, setNeedsManualSummary] = useState(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [selectedJudgmentIds, setSelectedJudgmentIds] = useState<string[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const runAnalysis = useCallback(
    async (summaryOverride?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/complaints/${complaintId}/legal-sections/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ case_summary: summaryOverride || null }),
        });

        if (res.status === 422) {
          // Backend couldn't find a stored case summary — ask the officer to enter one.
          setNeedsManualSummary(true);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }

        const data: AnalysisResult = await res.json();
        setResult(data);
        setCaseSummary(data.case_summary);
        setNeedsManualSummary(false);

        setSelectedSectionIds((current) =>
          current.filter((id) => data.sections.some((section) => section.id === id)),
        );
        setSelectedJudgmentIds((current) =>
          current.filter((id) => data.judgments.some((judgment) => judgment.id === id)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [complaintId]
  );

  useEffect(() => {
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaintId]);

  const selectedSections = result?.sections.filter((section) => selectedSectionIds.includes(section.id)) ?? [];
  const selectedJudgments = result?.judgments.filter((judgment) => selectedJudgmentIds.includes(judgment.id)) ?? [];

  const selectedCount = selectedSections.length + selectedJudgments.length;

  async function handleSaveDraft() {
    if (!result) return;
    setSavingDraft(true);
    setError(null);
    try {
      const payload = {
        complaint_id: complaintId,
        crime_category: result.sections[0]?.category || null,
        summary: caseSummary,
        draft_content: {
          selected_sections: selectedSections,
          selected_judgments: selectedJudgments,
        },
      };

      const res = await fetch(`${API_BASE}/api/fir-drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setDraftId(data.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save FIR draft');
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
        throw new Error(data?.detail || `Request failed (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `fir_draft_${draftId}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Failed to download DOCX');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <DashboardLayout>
        
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Legal Section Intelligence</h1>
            <p className="mt-2 text-slate-600">Complaint {complaintId}</p>
          </div>

          {/* Case summary panel */}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Case summary used for analysis
            </label>
            <textarea
              value={caseSummary}
              onChange={(e) => setCaseSummary(e.target.value)}
              rows={3}
              placeholder="Describe the incident (who, what, where, how)…"
              className="w-full resize-none rounded-md border border-slate-300 p-2.5 text-sm text-slate-800 focus:border-red-900 focus:outline-none focus:ring-1 focus:ring-red-900"
            />
            <div className="mt-2 flex items-center justify-between gap-4">
              {needsManualSummary && (
                <p className="text-xs text-amber-700">
                  No stored summary found for this complaint — enter one above to analyze.
                </p>
              )}
              <button
                onClick={() => runAnalysis(caseSummary)}
                disabled={loading || !caseSummary.trim()}
                className="ml-auto rounded-md bg-amber-500 px-3.5 py-1.5 text-sm font-medium text-slate-900 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Analyzing…' : 'Re-analyze'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {error}
            </div>
          )}

          {draftId && (
            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              FIR draft saved. You can now download it below.
            </div>
          )}

          {downloadError && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {downloadError}
            </div>
          )}

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Selected items</p>
                <p className="text-sm text-slate-500">{selectedCount} item{selectedCount === 1 ? '' : 's'} selected</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={savingDraft || selectedCount === 0 || !result}
                  className="rounded-md bg-amber-500 px-3.5 py-1.5 text-sm font-medium text-slate-900 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingDraft ? 'Saving draft…' : 'Save FIR draft'}
                </button>
                <button
                  onClick={handleDownloadDraft}
                  disabled={!draftId}
                  className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download DOCX
                </button>
              </div>
            </div>
          </div>

          {/* Sections */}
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Applicable Sections</h2>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : result && result.sections.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {result.sections.map((s) => (
                  <SectionCard
                    key={`${s.act_code}-${s.id}`}
                    section={s}
                    selected={selectedSectionIds.includes(s.id)}
                    onToggle={() => {
                      setSelectedSectionIds((prev) =>
                        prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                      );
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {needsManualSummary ? 'Waiting on a case summary.' : 'No BNS/BNSS/BSA section matches. This case may fall under a special/local act.'}
              </p>
            )}
          </section>

          {/* Judgments */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Landmark Judgments</h2>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : result && result.judgments.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {result.judgments.map((j) => (
                  <JudgmentCard
                    key={j.id}
                    judgment={j}
                    selected={selectedJudgmentIds.includes(j.id)}
                    onToggle={() => {
                      setSelectedJudgmentIds((prev) =>
                        prev.includes(j.id) ? prev.filter((id) => id !== j.id) : [...prev, j.id],
                      );
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {needsManualSummary ? 'Waiting on a case summary.' : 'No relevant judgments found.'}
              </p>
            )}
          </section>
        </main>
      </div>
      </DashboardLayout>
    </div>
  );
}