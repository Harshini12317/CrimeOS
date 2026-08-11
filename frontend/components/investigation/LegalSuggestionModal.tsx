// components/investigation/LegalSuggestionModal.tsx
"use client";

import { useEffect, useState } from "react";
import GuidanceStepper from "./GuidanceStepper";

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

export default function LegalSuggestionModal({
  caseId,
  onClose,
}: {
  caseId: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [guidance, setGuidance] = useState<{
    steps: GuidanceStep[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch suggestion as soon as the modal opens
  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestion() {
      try {
        const res = await fetch(
          `/api/investigation/cases/${caseId}/suggest`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              force_regenerate: false,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Request failed.");
        }

        if (!cancelled) {
          setResult(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchSuggestion();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function handleGuidance() {
    if (!result?.suggestion_id) return;

    setError(null);
    setGuidanceLoading(true);

    try {
      const res = await fetch(
        `/api/investigation/suggestions/${result.suggestion_id}/guidance`,
        {
          method: "POST",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Request failed.");
      }

      setGuidance(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setGuidanceLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-ink-900">
            Legal Suggestion
          </h2>

          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <p className="mt-4 text-sm text-ink-600">
            Analyzing case…
          </p>
        )}

        {/* Error */}
        {error && (
          <p className="mt-3 rounded-md border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm text-risk">
            {error}
          </p>
        )}

        {/* Suggestion result */}
        {result && (
          <div className="mt-4 space-y-4">
            {/* Suggested path */}
            {!!result.suggested_path?.length && (
              <div>
                <h3 className="text-sm font-medium text-ink-900">
                  Suggested path
                </h3>

                <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-ink-600">
                  {result.suggested_path.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Recommended sections */}
            {!!result.recommended_sections?.length && (
              <div>
                <h3 className="text-sm font-medium text-ink-900">
                  Recommended sections
                </h3>

                <ul className="mt-1 space-y-1 text-sm text-ink-600">
                  {result.recommended_sections.map((section, i) => (
                    <li key={i}>
                      {section.act_code}{" "}
                      {section.section_number}

                      {section.title
                        ? ` — ${section.title}`
                        : ""}

                      {section.relevance_reason && (
                        <div className="text-xs text-ink-500">
                          {section.relevance_reason}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Request guidance */}
            {!guidance && (
              <button
                onClick={handleGuidance}
                disabled={guidanceLoading}
                className="rounded-md border border-gold-300 px-4 py-2 text-sm text-ink-900 transition-colors hover:bg-gold-50 disabled:opacity-60"
              >
                {guidanceLoading
                  ? "Loading…"
                  : "Request step-by-step guidance"}
              </button>
            )}

            {/* Guidance */}
            {guidance && (
              <GuidanceStepper
                caseId={caseId}
                steps={guidance.steps}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}