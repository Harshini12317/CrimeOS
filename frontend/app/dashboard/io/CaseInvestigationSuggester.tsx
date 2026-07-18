"use client";

import { useState, type FormEvent } from "react";

interface RecommendedSection {
  code?: string;
  act?: string;
  title?: string;
  [key: string]: unknown;
}

interface SuggestionResult {
  suggestion_id: string;
  suggested_path?: string[];
  recommended_sections?: RecommendedSection[];
  case_law_refs?: string[];
}

export default function CaseInvestigationSuggester() {
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [guidance, setGuidance] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSuggest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setGuidance(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/investigation/cases/${encodeURIComponent(caseId)}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force_regenerate: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

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
    <section className="rounded-lg border border-gold-200 bg-white p-5">
      <h2 className="font-medium text-ink-900">Suggested Investigation Path</h2>
      <p className="mt-1 text-sm text-ink-600">
        AI-suggested paths grounded in SOPs, with relevant BNS/BNSS/BSA sections and case law.
      </p>

      <form onSubmit={handleSuggest} className="mt-4 flex gap-2">
        <input
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          required
          placeholder="Enter case ID"
          className="flex-1 rounded-md border border-gold-200 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-maroon-600 px-4 py-2 text-sm font-medium text-white
                     hover:bg-maroon-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing…" : "Suggest"}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-risk bg-maroon-50 border border-maroon-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          {!!result.suggested_path?.length && (
            <div>
              <h3 className="text-sm font-medium text-ink-900">Suggested path</h3>
              <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-ink-600">
                {result.suggested_path.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {!!result.recommended_sections?.length && (
            <div>
              <h3 className="text-sm font-medium text-ink-900">Recommended sections</h3>
              <ul className="mt-1 space-y-1 text-sm text-ink-600">
                {result.recommended_sections.map((s, i) => (
                  <li key={i}>
                    {s.code ? `${s.code}${s.act ? ` (${s.act})` : ""}${s.title ? ` — ${s.title}` : ""}` : JSON.stringify(s)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!result.case_law_refs?.length && (
            <div>
              <h3 className="text-sm font-medium text-ink-900">Case law references</h3>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-600">
                {result.case_law_refs.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {!guidance && (
            <button
              onClick={handleGuidance}
              disabled={guidanceLoading}
              className="rounded-md border border-gold-300 px-4 py-2 text-sm text-ink-900
                         hover:bg-gold-50 disabled:opacity-60 transition-colors"
            >
              {guidanceLoading ? "Loading…" : "Request step-by-step guidance"}
            </button>
          )}

          {guidance !== null && (
            <div>
              <h3 className="text-sm font-medium text-ink-900">Step-by-step guidance</h3>
              <pre className="mt-1 whitespace-pre-wrap text-sm text-ink-600">
                {typeof guidance === "string" ? guidance : JSON.stringify(guidance, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}