// app/investigation/ai-assistant/[caseId]/sop/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import GuidanceStepper from "@/components/investigation/GuidanceStepper";
import { ArrowLeft, BookOpen, Scale, Sparkles, FileText } from "lucide-react";

interface RecommendedSection {
  act_code?: string;
  section_number?: string;
  title?: string;
  relevance_reason?: string;
  summary?: string; // Long summary field from backend
  procedural_notes?: string;
}

interface SuggestionResult {
  suggestion_id: string;
  suggested_path?: string[];
  recommended_sections?: RecommendedSection[];
  case_law_refs?: string[];
}

interface GuidanceStep {
  step_number: number;
  action: string;
  legal_basis?: string;
}

export default function InvestigationSopPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);

  const [loading, setLoading] = useState(true);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [guidance, setGuidance] = useState<{ steps: GuidanceStep[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/investigation/cases/${caseId}/suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force_regenerate: false }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed.");
        if (!cancelled) setResult(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function handleGuidance() {
    if (!result?.suggestion_id) return;
    setError(null);
    setGuidanceLoading(true);
    try {
      const res = await fetch(`/api/investigation/suggestions/${result.suggestion_id}/guidance`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setGuidance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setGuidanceLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          
          {/* Header */}
          <div>
            <Link
              href={`/ai-assistant`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-maroon-700 hover:text-maroon-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Case Assistant
            </Link>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold text-ink-900">Suggested Investigation Plan</h1>
                  <span className="rounded-md bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-maroon-800">
                    AI Guided SOP
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500 font-mono">Case ID: {caseId}</p>
                <p className="mt-2 text-sm text-ink-600">
                  Standard procedural steps generated based on relevant legal codes and judicial precedents.
                </p>
              </div>

              {!guidance && result && (
                <button
                  onClick={handleGuidance}
                  disabled={guidanceLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-maroon-600 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-700 disabled:opacity-60 transition-colors shrink-0"
                >
                  <Sparkles className="h-4 w-4" />
                  {guidanceLoading ? "Loading…" : "Request step-by-step guidance"}
                </button>
              )}
            </div>
          </div>

          {loading && (
            <div className="rounded-lg border border-gold-200 bg-white p-6 text-sm text-ink-600 shadow-sm">
              Analyzing case facts & legal provisions…
            </div>
          )}

          {error && (
            <div className="rounded-md border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm text-risk">
              {error}
            </div>
          )}

          {result && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-6">
                {guidance ? (
                  <GuidanceStepper caseId={caseId} steps={guidance.steps} />
                ) : (
                  result.suggested_path?.length && (
                    <div className="rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-medium text-ink-900 flex items-center gap-2 mb-4">
                        <FileText className="h-4 w-4 text-maroon-700" />
                        Suggested Path Overview
                      </h3>
                      <ol className="relative border-l border-gold-200 ml-3 space-y-4">
                        {result.suggested_path.map((step, i) => (
                          <li key={i} className="ml-6">
                            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 text-xs font-bold text-maroon-800 ring-4 ring-white">
                              {i + 1}
                            </span>
                            <p className="text-sm font-medium text-ink-800">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )
                )}
              </div>

              {/* Legal Sidebar: Detailed Legal Sections */}
              <div className="space-y-6">
                {!!result.recommended_sections?.length && (
                  <div className="rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-ink-900 flex items-center gap-2 border-b border-gold-100 pb-3">
                      <Scale className="h-4 w-4 text-maroon-700" /> Recommended Sections
                    </h3>
                    <div className="mt-3 space-y-4">
                      {result.recommended_sections.map((s, i) => (
                        <div key={i} className="rounded-md bg-slate-50 p-3.5 border border-gold-200/80 space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-xs text-maroon-800 bg-gold-100 px-2 py-0.5 rounded">
                              {s.act_code} {s.section_number}
                            </span>
                            {s.title && <span className="text-xs font-medium text-ink-900">{s.title}</span>}
                          </div>

                          {/* Relevance Reason */}
                          {s.relevance_reason && (
                            <p className="text-xs text-ink-700 leading-relaxed">
                              {s.relevance_reason}
                            </p>
                          )}

                          {/* Full Backend Summary Text */}
                          {s.summary && (
                            <div className="mt-2 text-xs text-ink-600 bg-white p-2.5 rounded border border-slate-200 leading-normal">
                              <span className="font-medium text-ink-800 block mb-0.5">Section Details:</span>
                              {s.summary}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!!result.case_law_refs?.length && (
                  <div className="rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-ink-900 flex items-center gap-2 border-b border-gold-100 pb-3">
                      <BookOpen className="h-4 w-4 text-maroon-700" /> Case Law References
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {result.case_law_refs.map((c, i) => (
                        <li key={i} className="text-xs text-ink-700 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                          {String(c)}
                        </li>
                      ))}
                    </ul>
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