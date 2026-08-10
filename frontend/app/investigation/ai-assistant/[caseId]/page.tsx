"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import GuidanceStepper from "@/components/investigation/GuidanceStepper";

interface RecommendedSection {
  act_code?: string;
  section_number?: string;
  title?: string;
  relevance_reason?: string;
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

export default function AiAssistantCasePage({
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
        <main className="flex-1 p-6 lg:p-8 max-w-3xl">
          <Link
            href="/ai-assistant"
            className="text-sm font-medium text-maroon-700 hover:text-maroon-900"
          >
            ← Back to AI Assistant
          </Link>

          <div className="mt-3 mb-6">
            <h1 className="text-2xl font-semibold text-ink-900">Legal Suggestion</h1>
            <p className="mt-1 text-sm text-ink-500">Case {caseId}</p>
          </div>

          {loading && (
            <p className="rounded-lg border border-gold-200 bg-white p-5 text-sm text-ink-600">
              Analyzing case…
            </p>
          )}

          {error && (
            <p className="rounded-md border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm text-risk">
              {error}
            </p>
          )}

          {result && (
            <div className="space-y-6">
              {!!result.suggested_path?.length && (
                <div className="rounded-lg border border-gold-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-ink-900">Suggested path</h3>
                  <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm text-ink-600">
                    {result.suggested_path.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {!!result.recommended_sections?.length && (
                <div className="rounded-lg border border-gold-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-ink-900">Recommended sections</h3>
                  <ul className="mt-2 space-y-2 text-sm text-ink-600">
                    {result.recommended_sections.map((s, i) => (
                      <li key={i}>
                        <span className="font-medium text-ink-800">
                          {s.act_code} {s.section_number}
                        </span>
                        {s.title ? ` — ${s.title}` : ""}
                        {s.relevance_reason && (
                          <div className="text-xs text-ink-500">{s.relevance_reason}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!result.case_law_refs?.length && (
                <div className="rounded-lg border border-gold-200 bg-white p-5">
                  <h3 className="text-sm font-medium text-ink-900">Case law references</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-ink-600">
                    {result.case_law_refs.map((c, i) => (
                      <li key={i}>{String(c)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!guidance && (
                <button
                  onClick={handleGuidance}
                  disabled={guidanceLoading}
                  className="rounded-md border border-gold-300 bg-white px-4 py-2 text-sm text-ink-900
                             hover:bg-gold-50 disabled:opacity-60 transition-colors"
                >
                  {guidanceLoading ? "Loading…" : "Request step-by-step guidance"}
                </button>
              )}

              {guidance && <GuidanceStepper steps={guidance.steps} />}
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}