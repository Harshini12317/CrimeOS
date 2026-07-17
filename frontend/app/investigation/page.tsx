"use client";

/**
 * InvestigationSuggestionTest — a minimal functional component to verify
 * the FR2 backend integration works end-to-end from the frontend.
 *
 * Usage: drop into any page,
 *
 *   import InvestigationSuggestionTest from "@/components/InvestigationSuggestionTest";
 *   export default function Page() {
 *     return <InvestigationSuggestionTest />;
 *   }
 *
 * Set NEXT_PUBLIC_API_URL in your .env.local, e.g.:
 *   NEXT_PUBLIC_API_URL=http://localhost:8000
 */

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type RecommendedSection = {
  act_code: string;
  section_number: string;
  title?: string;
  relevance_reason?: string;
};

type CaseLawRef = {
  case_title?: string;
  court?: string;
  bail_outcome?: string;
  relevance_reason?: string;
};

type SuggestionResponse = {
  suggestion_id: string;
  suggested_path: string[];
  recommended_sections: RecommendedSection[];
  case_law_refs: CaseLawRef[];
  notes?: string;
};

type GuidanceStep = {
  step_number: number;
  action: string;
  legal_basis?: string;
};

type GuidanceResponse = {
  steps: GuidanceStep[];
};

export default function InvestigationSuggestionTest() {
  const [caseId, setCaseId] = useState("CASE-TEST-0001");
  const [officerId, setOfficerId] = useState("");
  const [suggestion, setSuggestion] = useState<SuggestionResponse | null>(null);
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetSuggestion() {
    setLoadingSuggestion(true);
    setError(null);
    setSuggestion(null);
    setGuidance(null);
    try {
      const res = await fetch(
        `${API_URL}/investigation/cases/${encodeURIComponent(caseId)}/suggest-investigation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }
      const data: SuggestionResponse = await res.json();
      setSuggestion(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingSuggestion(false);
    }
  }

  async function handleGetGuidance() {
    if (!suggestion) return;
    setLoadingGuidance(true);
    setError(null);
    try {
      const params = officerId ? `?officer_id=${encodeURIComponent(officerId)}` : "";
      const res = await fetch(
        `${API_URL}/investigation/suggestions/${suggestion.suggestion_id}/step-by-step-guidance${params}`,
        { method: "POST" }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${text}`);
      }
      const data: GuidanceResponse = await res.json();
      setGuidance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingGuidance(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        FR2 Investigation Suggestion — Test
      </h2>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
        Calling: {API_URL}
      </p>

      <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Case ID</label>
      <input
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
        style={{ width: "100%", padding: 8, marginBottom: 12, border: "1px solid #ccc", borderRadius: 4 }}
      />

      <button
        onClick={handleGetSuggestion}
        disabled={loadingSuggestion || !caseId}
        style={{
          padding: "8px 16px",
          background: "#1a1a1a",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: loadingSuggestion ? "default" : "pointer",
          opacity: loadingSuggestion ? 0.6 : 1,
        }}
      >
        {loadingSuggestion ? "Loading..." : "Get investigation suggestion"}
      </button>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: "#fee", color: "#900", borderRadius: 4, fontSize: 13, whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      )}

      {suggestion && (
        <div style={{ marginTop: 20, padding: 16, background: "#f7f7f7", borderRadius: 8 }}>
          <p style={{ fontSize: 12, color: "#888" }}>suggestion_id: {suggestion.suggestion_id}</p>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Suggested path</h3>
          <ul style={{ paddingLeft: 20 }}>
            {suggestion.suggested_path.map((step, i) => (
              <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>{step}</li>
            ))}
          </ul>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Recommended sections</h3>
          {suggestion.recommended_sections.length === 0 && (
            <p style={{ fontSize: 13, color: "#888" }}>None returned.</p>
          )}
          <ul style={{ paddingLeft: 20 }}>
            {suggestion.recommended_sections.map((s, i) => (
              <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>
                <strong>{s.act_code} {s.section_number}</strong>{s.title ? ` — ${s.title}` : ""}
                {s.relevance_reason && (
                  <div style={{ fontSize: 12, color: "#666" }}>{s.relevance_reason}</div>
                )}
              </li>
            ))}
          </ul>

          <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 12 }}>Case law references</h3>
          {suggestion.case_law_refs.length === 0 && (
            <p style={{ fontSize: 13, color: "#888" }}>None returned.</p>
          )}
          <ul style={{ paddingLeft: 20 }}>
            {suggestion.case_law_refs.map((c, i) => (
              <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>
                <strong>{c.case_title}</strong>{c.court ? ` (${c.court})` : ""}
              </li>
            ))}
          </ul>

          {suggestion.notes && (
            <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Notes: {suggestion.notes}</p>
          )}

          <div style={{ marginTop: 16 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
              Officer ID (optional)
            </label>
            <input
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 8, border: "1px solid #ccc", borderRadius: 4 }}
            />
            <button
              onClick={handleGetGuidance}
              disabled={loadingGuidance}
              style={{
                padding: "8px 16px",
                background: "#333",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: loadingGuidance ? "default" : "pointer",
                opacity: loadingGuidance ? 0.6 : 1,
              }}
            >
              {loadingGuidance ? "Loading..." : "Get step-by-step guidance (on demand)"}
            </button>
          </div>
        </div>
      )}

      {guidance && (
        <div style={{ marginTop: 16, padding: 16, background: "#eef7ee", borderRadius: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Step-by-step guidance</h3>
          <ol style={{ paddingLeft: 20 }}>
            {guidance.steps.map((s) => (
              <li key={s.step_number} style={{ fontSize: 14, marginBottom: 6 }}>
                {s.action}
                {s.legal_basis && (
                  <div style={{ fontSize: 12, color: "#666" }}>{s.legal_basis}</div>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}