"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import {
  getMyCases,
  getComplaintDetail,
  analyzeLegalSections,
  ApiError,
  type CaseListItem,
  type ComplaintDetailResponse,
  type AnalyzeResponse,
  LegalSectionResult,
} from "@/lib/caseSummaryApi";
import {
  Shield,
  Printer,
  FileText,
  MapPin,
  User,
  Calendar,
  Activity,
  AlertCircle,
  TrendingUp,
  FileDigit,
  Paperclip,
  Clock,
  Scale,
  Gavel,
  Save,
  RefreshCw,
  Search,
  Users,
  UserSquare2,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function badgeClasses(value: string | null | undefined) {
  const v = (value || "").toLowerCase();
  if (["high", "critical", "urgent"].includes(v)) return "bg-red-50 text-red-800 border-red-200";
  if (["medium", "in progress", "under investigation"].includes(v)) return "bg-amber-50 text-amber-800 border-amber-200";
  if (["low", "closed", "resolved", "completed"].includes(v)) return "bg-emerald-50 text-emerald-800 border-emerald-200";
  return "bg-gold-50 text-ink-900 border-gold-200";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function similarityPct(v: number | undefined) {
  if (typeof v !== "number" || isNaN(v)) return null;
  return Math.round(v * 100);
}

// ---------------------------------------------------------------------------
// Left pane: case list
// ---------------------------------------------------------------------------

function CaseListPane({
  cases,
  loading,
  error,
  selectedCaseId,
  onSelect,
  onRetry,
}: {
  cases: CaseListItem[];
  loading: boolean;
  error: string | null;
  selectedCaseId: string | null;
  onSelect: (c: CaseListItem) => void;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cases;
    return cases.filter((c) =>
      [c.case_number, c.title, c.status, c.priority, c.current_stage]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q))
    );
  }, [cases, query]);

  return (
    <aside className="w-full md:w-[340px] shrink-0 border-r border-gold-200 bg-white flex flex-col md:sticky md:top-6 md:max-h-[calc(100vh-96px)] print:hidden">
      <div className="p-4 border-b border-gold-100 space-y-3 bg-white">
        <h2 className="font-display text-sm font-bold text-maroon-900 uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4 w-4" /> My Cases
          {!loading && !error && (
            <span className="ml-auto text-[10px] font-mono font-normal text-ink-600 normal-case tracking-normal">
              {cases.length}
            </span>
          )}
        </h2>
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-ink-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search case #, title, status..."
            className="w-full text-xs pl-8 pr-3 py-2 border border-gold-300 rounded-full focus:outline-none focus:border-maroon-600 bg-ivory/30"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-ivory/10">
        {loading && (
          <div className="p-6 text-center text-xs text-ink-600 flex flex-col items-center gap-2">
            <Activity className="h-5 w-5 animate-spin text-maroon-600" />
            Loading your cases...
          </div>
        )}

        {!loading && error && (
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-xs text-red-800 space-y-2">
            <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Couldn't load cases</p>
            <p>{error}</p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 text-red-800 font-semibold underline underline-offset-2"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-xs text-ink-600 p-6 text-center">
            {cases.length === 0 ? "No cases are currently assigned to you." : "No cases match your search."}
          </p>
        )}

        {!loading &&
          !error &&
          filtered.map((c) => {
            const active = c.case_id === selectedCaseId;
            return (
              <button
                key={c.case_id}
                onClick={() => onSelect(c)}
                className={`w-full text-left rounded-lg p-3 border transition ${
                  active
                    ? "bg-white border-maroon-700 border-l-4 shadow-sm ring-1 ring-maroon-100"
                    : "bg-white border-gold-100 hover:border-gold-300 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className={`text-[11px] font-mono font-bold ${active ? "text-maroon-800" : "text-ink-600"}`}>
                    {c.case_number || c.case_id}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border shrink-0 ${badgeClasses(c.priority)}`}
                  >
                    {c.priority || "—"}
                  </span>
                </div>
                <p className="text-sm font-semibold mt-1 truncate text-ink-900">
                  {c.title || "Untitled case"}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${badgeClasses(c.status)}`}>
                    {c.status || "—"}
                  </span>
                  <span className="text-[10px] text-ink-600 truncate ml-2">
                    {c.current_stage || ""}
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Right pane sections
// ---------------------------------------------------------------------------

function SectionCard({
  id,
  title,
  icon,
  children,
}: {
  id?: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 bg-white border border-gold-200 rounded-xl p-6 space-y-4 print:border-0 print:p-0 print:rounded-none">
      <h2 className="font-display text-lg font-bold text-maroon-900 pb-3 border-b border-gold-100 flex items-center gap-3 print:text-ink-900">
        <span className="h-8 w-8 rounded-full bg-gold-50 text-maroon-700 flex items-center justify-center shrink-0 print:hidden">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const QUICK_NAV_SECTIONS = [
  { id: "section-info", label: "Overview" },
  { id: "section-summary", label: "AI Summary" },
  { id: "section-legal", label: "Legal Sections" },
  { id: "section-judgments", label: "Judgments" },
  { id: "section-people", label: "People" },
  { id: "section-evidence", label: "Evidence" },
  { id: "section-notes", label: "Notes" },
];

function QuickNav() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <div className="sticky top-3 z-10 flex justify-center print:hidden">
      <nav className="flex flex-wrap justify-center gap-1 bg-white/95 backdrop-blur border border-gold-200 rounded-full shadow-sm px-2 py-1.5 max-w-full">
        {QUICK_NAV_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className="text-[11px] font-semibold text-ink-700 hover:text-maroon-800 hover:bg-gold-50 px-2.5 py-1.5 rounded-full transition whitespace-nowrap"
          >
            {s.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function CaseInfoGrid({ caseItem, complaint }: { caseItem: CaseListItem; complaint: ComplaintDetailResponse["complaint"] }) {
  const items = [
    { label: "Case Number", value: caseItem.case_number, icon: <FileDigit className="h-4 w-4 text-gold-600 print:hidden" />, mono: true },
    { label: "Complaint Number", value: complaint.complaint_number, icon: <Shield className="h-4 w-4 text-gold-600 print:hidden" />, mono: true },
    { label: "Crime Category", value: `${complaint.crime_category}${complaint.crime_subcategory ? ` / ${complaint.crime_subcategory}` : ""}`, icon: <Activity className="h-4 w-4 text-gold-600 print:hidden" /> },
    { label: "Complaint Type", value: complaint.complaint_type, icon: <FileText className="h-4 w-4 text-gold-600 print:hidden" /> },
    { label: "Location", value: complaint.location || "Not specified", icon: <MapPin className="h-4 w-4 text-gold-600 print:hidden" /> },
    { label: "Incident Date/Time", value: [complaint.incident_date, complaint.incident_time].filter(Boolean).join(" ") || "Not specified", icon: <Calendar className="h-4 w-4 text-gold-600 print:hidden" />, mono: true },
    { label: "Current Stage", value: caseItem.current_stage || "—", icon: <TrendingUp className="h-4 w-4 text-gold-600 print:hidden" /> },
    { label: "Priority", value: caseItem.priority, icon: <AlertCircle className="h-4 w-4 text-gold-600 print:hidden" />, highlight: true },
    { label: "Status", value: caseItem.status, icon: <TrendingUp className="h-4 w-4 text-gold-600 print:hidden" /> },
    { label: "Registered", value: formatDate(complaint.created_at), icon: <Calendar className="h-4 w-4 text-gold-600 print:hidden" />, mono: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
      {items.map((item, idx) => (
        <div key={idx} className="space-y-1">
          <span className="text-xs text-ink-600 uppercase font-semibold flex items-center gap-1">
            {item.icon} {item.label}
          </span>
          <p
            className={`font-medium text-ink-900 ${item.mono ? "font-mono text-xs" : ""} ${
              item.highlight && (caseItem.priority || "").toLowerCase() === "high" ? "text-red-700 font-bold" : ""
            }`}
          >
            {item.value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

function AiSummaryBlock({
  analysis,
  loading,
  error,
  onReanalyze,
  reanalyzing,
}: {
  analysis: AnalyzeResponse | null;
  loading: boolean;
  error: string | null;
  onReanalyze: (editedSummary: string) => void;
  reanalyzing: boolean;
}) {
  const [draft, setDraft] = useState(analysis?.case_summary ?? "");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setDraft(analysis?.case_summary ?? "");
    setEditing(false);
  }, [analysis?.case_summary]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-600 py-4">
        <Activity className="h-4 w-4 animate-spin text-maroon-600" /> Generating case summary and retrieving applicable law...
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-xs text-red-800 space-y-1">
        <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Couldn't generate the case summary</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-gold-50/20 border-l-4 border-l-gold-500 p-5 rounded-r-lg space-y-4 print:bg-white print:p-0 print:border-l-0">
      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          className="w-full text-sm leading-relaxed border border-gold-300 rounded-lg p-3 focus:outline-none focus:border-maroon-600 bg-white text-ink-900"
        />
      ) : (
        <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-wrap">{analysis.case_summary}</p>
      )}

      <div className="flex items-center justify-between gap-3 print:hidden">
        {editing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                onReanalyze(draft);
              }}
              disabled={reanalyzing || !draft.trim()}
              className="inline-flex items-center gap-1.5 bg-maroon-800 text-ivory px-3 py-1.5 text-xs font-medium rounded-md hover:bg-maroon-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${reanalyzing ? "animate-spin" : ""}`} /> Save &amp; Re-analyze
            </button>
            <button
              onClick={() => {
                setDraft(analysis.case_summary);
                setEditing(false);
              }}
              className="text-xs text-ink-600 font-medium px-3 py-1.5 rounded-md hover:bg-gold-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-maroon-800 underline underline-offset-2"
          >
            Edit summary &amp; re-analyze
          </button>
        )}
        {reanalyzing && !editing && (
          <span className="text-xs text-ink-600 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 animate-spin" /> Re-analyzing...
          </span>
        )}
      </div>
    </div>
  );
}

const SECTION_PREVIEW_LENGTH = 180;

function SectionDetailModal({ section, onClose }: { section: LegalSectionResult; onClose: () => void }) {
  const pct = similarityPct(section.similarity);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 print:hidden"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded mr-2">
                {section.act_code}
              </span>
              <span className="text-sm font-bold text-ink-900 font-mono">Sec {section.section_number}</span>
              <p className="text-base font-semibold text-ink-900 mt-0.5">{section.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pct !== null && (
                <span className="text-[10px] font-mono font-bold text-maroon-800 bg-gold-50 border border-gold-200 rounded px-2 py-0.5">
                  {pct}% match
                </span>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-ink-600 hover:text-ink-900 text-lg leading-none px-1"
              >
                ×
              </button>
            </div>
          </div>

          {section.section_text && (
            <p className="text-sm text-ink-900 leading-relaxed whitespace-pre-wrap border-t border-gold-100 pt-3">
              {section.section_text}
            </p>
          )}

          {section.reason && (
            <p className="text-xs text-ink-900 italic border-t border-gold-100 pt-3">
              <span className="font-semibold not-italic">Why it applies: </span>
              {section.reason}
            </p>
          )}

          {section.cross_references.length > 0 && (
            <div className="border-t border-gold-100 pt-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase text-ink-600">Cross-references</p>
              <div className="flex flex-wrap gap-1.5">
                {section.cross_references.map((ref, i) => (
                  <span
                    key={i}
                    title={ref.summary_of_comparison || undefined}
                    className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded"
                  >
                    <LinkIcon className="h-2.5 w-2.5" /> {ref.act} {ref.section}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LegalSectionsList({ analysis }: { analysis: AnalyzeResponse | null }) {
  const [expanded, setExpanded] = useState<LegalSectionResult | null>(null);

  if (!analysis) return null;
  if (analysis.sections.length === 0) {
    return <p className="text-xs text-ink-600 py-3 text-center">No legal sections matched this case summary.</p>;
  }
  return (
    <>
      <div className="space-y-3">
        {analysis.sections.map((s) => {
          const pct = similarityPct(s.similarity);
          const text = s.section_text || "";
          const isLong = text.length > SECTION_PREVIEW_LENGTH;
          const preview = isLong ? `${text.slice(0, SECTION_PREVIEW_LENGTH).trimEnd()}…` : text;
          return (
            <div key={s.id} className="border border-gold-100 rounded-lg p-4 bg-ivory/20 space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded mr-2">
                    {s.act_code}
                  </span>
                  <span className="text-sm font-bold text-ink-900 font-mono">Sec {s.section_number}</span>
                  <p className="text-sm font-semibold text-ink-900 mt-0.5">{s.title}</p>
                </div>
                {pct !== null && (
                  <span className="text-[10px] font-mono font-bold text-maroon-800 bg-white border border-gold-200 rounded px-2 py-0.5 shrink-0">
                    {pct}% match
                  </span>
                )}
              </div>
              {preview && <p className="text-xs text-ink-600 leading-relaxed">{preview}</p>}
              {isLong && (
                <button
                  onClick={() => setExpanded(s)}
                  className="text-[11px] font-semibold text-maroon-800 underline underline-offset-2"
                >
                  Show full text
                </button>
              )}
              {s.reason && (
                <p className="text-xs text-ink-900 italic border-t border-gold-100 pt-2">
                  <span className="font-semibold not-italic">Why it applies: </span>
                  {s.reason}
                </p>
              )}
              {s.cross_references.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {s.cross_references.map((ref, i) => (
                    <span
                      key={i}
                      title={ref.summary_of_comparison || undefined}
                      className="inline-flex items-center gap-1 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded"
                    >
                      <LinkIcon className="h-2.5 w-2.5" /> {ref.act} {ref.section}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {expanded && <SectionDetailModal section={expanded} onClose={() => setExpanded(null)} />}
    </>
  );
}

function JudgmentsList({ analysis }: { analysis: AnalyzeResponse | null }) {
  if (!analysis) return null;
  if (analysis.judgments.length === 0) {
    return <p className="text-xs text-ink-600 py-3 text-center">No landmark judgments matched this case summary.</p>;
  }
  return (
    <div className="space-y-3">
      {analysis.judgments.map((j) => {
        const pct = similarityPct(j.similarity);
        return (
          <div key={j.id} className="border border-gold-100 rounded-lg p-4 bg-ivory/20 space-y-1.5">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="text-sm font-bold text-ink-900">{j.case_title}</p>
                <p className="text-[10px] text-ink-600 font-mono">
                  {j.court || "Court N/A"} {j.case_date ? `• ${formatDate(j.case_date)}` : ""}
                </p>
              </div>
              {pct !== null && (
                <span className="text-[10px] font-mono font-bold text-maroon-800 bg-white border border-gold-200 rounded px-2 py-0.5 shrink-0">
                  {pct}% match
                </span>
              )}
            </div>
            {j.ipc_sections && <p className="text-[10px] text-ink-600">Sections: <span className="font-mono">{j.ipc_sections}</span></p>}
            {j.summary && <p className="text-xs text-ink-600 leading-relaxed">{j.summary}</p>}
            {j.bail_outcome && (
              <p className="text-[10px] font-semibold text-ink-900">Bail outcome: <span className="font-normal">{j.bail_outcome}</span></p>
            )}
            {j.reason && (
              <p className="text-xs text-ink-900 italic border-t border-gold-100 pt-2">
                <span className="font-semibold not-italic">Why it's relevant: </span>
                {j.reason}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PeoplePanel({ detail }: { detail: ComplaintDetailResponse }) {
  const groups: Array<{ label: string; icon: React.ReactNode; rows: Array<Record<string, any>> }> = [
    { label: "Complainants", icon: <User className="h-4 w-4 text-maroon-600" />, rows: detail.complainants },
    { label: "Victims", icon: <Users className="h-4 w-4 text-maroon-600" />, rows: detail.victims },
    { label: "Suspects", icon: <UserSquare2 className="h-4 w-4 text-maroon-600" />, rows: detail.suspects },
  ];

  const anyPeople = groups.some((g) => g.rows.length > 0);
  if (!anyPeople) {
    return <p className="text-xs text-ink-600 py-3 text-center">No complainants, victims, or suspects recorded.</p>;
  }

  return (
    <div className="space-y-5">
      {groups.map(
        (g) =>
          g.rows.length > 0 && (
            <div key={g.label} className="space-y-2">
              <h3 className="text-xs font-bold text-ink-900 uppercase tracking-wide flex items-center gap-1.5">
                {g.icon} {g.label}
              </h3>
              <div className="space-y-2">
                {g.rows.map((r, i) => (
                  <div key={r.complainant_id || r.victim_id || r.suspect_id || i} className="border border-gold-100 rounded p-3 bg-ivory/20 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-ink-900">{r.name || "Unnamed"}</span>
                      {r.status && (
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${badgeClasses(r.status)}`}>{r.status}</span>
                      )}
                    </div>
                    <div className="text-ink-600 mt-1 space-y-0.5">
                      {r.contact && <p>Contact: <span className="font-mono">{r.contact}</span></p>}
                      {r.relationship && <p>Relationship: {r.relationship}</p>}
                      {r.address && <p>Address: {r.address}</p>}
                      {r.description && <p className="italic">{r.description}</p>}
                      {r.statement && <p className="italic border-t border-gold-100 pt-1 mt-1">"{r.statement}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}

function EvidenceLocker({ evidence }: { evidence: ComplaintDetailResponse["evidence"] }) {
  if (evidence.length === 0) {
    return <p className="text-xs text-ink-600 py-3 text-center">No evidence files registered.</p>;
  }
  return (
    <div className="space-y-2">
      {evidence.map((item) => (
        <div key={item.evidence_id} className="border border-gold-100 p-2.5 rounded bg-ivory/20 hover:bg-gold-50/20 transition duration-150 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Paperclip className="h-4 w-4 text-maroon-600 shrink-0" />
              <div className="min-w-0">
                {item.cloudinary_url ? (
                  <a
                    href={item.cloudinary_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-maroon-800 underline underline-offset-2 truncate block"
                  >
                    {item.file_name || item.evidence_type}
                  </a>
                ) : (
                  <p className="text-xs font-bold text-ink-900 truncate">{item.file_name || item.evidence_type}</p>
                )}
                <span className="text-[10px] text-ink-600 uppercase font-semibold">{item.evidence_type}</span>
              </div>
            </div>
            <span className="text-[9px] text-ink-600 font-mono shrink-0">{formatDate(item.created_at)}</span>
          </div>
          {item.summary && <p className="text-[11px] text-ink-600 italic pl-6">{item.summary}</p>}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function CaseSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCaseId = searchParams.get("caseId");

  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casesError, setCasesError] = useState<string | null>(null);

  const [selectedCase, setSelectedCase] = useState<CaseListItem | null>(null);

  const [detail, setDetail] = useState<ComplaintDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  async function loadCases() {
    setCasesLoading(true);
    setCasesError(null);
    try {
      const data = await getMyCases();
      setCases(data);
      const preselect = (urlCaseId && data.find((c) => c.case_id === urlCaseId)) || data[0] || null;
      if (preselect) setSelectedCase(preselect);
    } catch (err) {
      setCasesError(err instanceof ApiError ? err.message : "Something went wrong loading your cases.");
    } finally {
      setCasesLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCaseDetails(caseItem: CaseListItem) {
    setDetail(null);
    setAnalysis(null);
    setDetailLoading(true);
    setDetailError(null);
    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const d = await getComplaintDetail(caseItem.complaint_id);
      setDetail(d);
      const savedNotes = typeof window !== "undefined" ? localStorage.getItem(`crimeos_notes_${d.complaint.complaint_id}`) : null;
      setNotes(savedNotes ?? d.complaint.officer_notes ?? "");
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : "Something went wrong loading this case.");
    } finally {
      setDetailLoading(false);
    }

    try {
      const a = await analyzeLegalSections(caseItem.complaint_id);
      setAnalysis(a);
    } catch (err) {
      setAnalysisError(err instanceof ApiError ? err.message : "Something went wrong generating the case summary.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  useEffect(() => {
    if (selectedCase) {
      loadCaseDetails(selectedCase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCase?.case_id]);

  function handleSelectCase(c: CaseListItem) {
    setSelectedCase(c);
    router.push(`/case-summary?caseId=${c.case_id}`);
  }

  async function handleReanalyze(editedSummary: string) {
    if (!selectedCase) return;
    setReanalyzing(true);
    setAnalysisError(null);
    try {
      const a = await analyzeLegalSections(selectedCase.complaint_id, editedSummary);
      setAnalysis(a);
    } catch (err) {
      setAnalysisError(err instanceof ApiError ? err.message : "Something went wrong re-analyzing this case.");
    } finally {
      setReanalyzing(false);
    }
  }

  function handleSaveNotes() {
    if (!detail) return;
    localStorage.setItem(`crimeos_notes_${detail.complaint.complaint_id}`, notes);
    setSaveStatus("Notes saved on this device. (Not yet synced to the server.)");
    setTimeout(() => setSaveStatus(null), 3500);
  }

  return (
    <div className="flex flex-col md:flex-row items-stretch min-h-full bg-white print:m-0 print:border-0">
      <CaseListPane
        cases={cases}
        loading={casesLoading}
        error={casesError}
        selectedCaseId={selectedCase?.case_id ?? null}
        onSelect={handleSelectCase}
        onRetry={loadCases}
      />

      <div className="flex-1 min-w-0 p-6 md:p-8 bg-ivory print:p-0 print:bg-white">
        {!selectedCase && !casesLoading && (
          <div className="flex flex-col items-center justify-center h-96 text-center gap-2">
            <Shield className="h-10 w-10 text-gold-400" />
            <p className="text-sm text-ink-600">Select a case from the list to view its summary.</p>
          </div>
        )}

        {selectedCase && (
          <div className="space-y-6 w-full max-w-7xl mx-auto">
            {/* Header / print bar */}
            <div className="bg-white border border-gold-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs print:hidden">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-ink-900">{selectedCase.title || "Untitled case"}</span>
                <span className="text-xs font-mono text-ink-600">{selectedCase.case_number}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${badgeClasses(selectedCase.status)}`}>
                  {selectedCase.status || "—"}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${badgeClasses(selectedCase.priority)}`}>
                  {selectedCase.priority || "—"} priority
                </span>
              </div>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 bg-maroon-800 text-ivory px-4 py-2 text-sm font-medium rounded-md shadow-sm hover:bg-maroon-700 transition duration-150 shrink-0"
              >
                <Printer className="h-4 w-4" /> Print Report
              </button>
            </div>

            <div className="text-center pb-5 border-b border-gold-300 relative print:border-b-2 print:border-ink-900">
              <div className="flex justify-center mb-2">
                <Shield className="h-10 w-10 text-maroon-800 print:text-ink-900" />
              </div>
              <h1 className="font-display text-xl font-bold uppercase tracking-widest text-maroon-900 print:text-ink-900">
                State Police Cyber Crime Division
              </h1>
              <p className="text-[11px] text-ink-600 font-semibold tracking-wider uppercase mt-1">
                Confidential Investigation Report // For Official Use Only
              </p>
              <span className="absolute right-0 bottom-1 font-mono text-[10px] text-ink-600">
                Ref ID: {selectedCase.case_number}-SUM
              </span>
            </div>

            {detailLoading && (
              <div className="flex items-center gap-2 text-sm text-ink-600 py-6 justify-center">
                <Activity className="h-5 w-5 animate-spin text-maroon-600" /> Loading case details...
              </div>
            )}

            {detailError && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-sm text-red-800 space-y-2">
                <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Couldn't load this case</p>
                <p>{detailError}</p>
                <button
                  onClick={() => loadCaseDetails(selectedCase)}
                  className="inline-flex items-center gap-1.5 text-red-800 font-semibold underline underline-offset-2 text-xs"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            )}

            {detail && (
              <>
                <QuickNav />

                <SectionCard id="section-info" title="1. Case Information" icon={<FileText className="h-4 w-4" />}>
                  <CaseInfoGrid caseItem={selectedCase} complaint={detail.complaint} />
                </SectionCard>

                <SectionCard id="section-summary" title="2. AI Case Summary" icon={<Activity className="h-4 w-4" />}>
                  <AiSummaryBlock
                    analysis={analysis}
                    loading={analysisLoading}
                    error={analysisError}
                    onReanalyze={handleReanalyze}
                    reanalyzing={reanalyzing}
                  />
                </SectionCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
                  <SectionCard id="section-legal" title="3. Applicable Legal Sections" icon={<Scale className="h-4 w-4" />}>
                    <LegalSectionsList analysis={analysis} />
                  </SectionCard>

                  <SectionCard id="section-judgments" title="4. Landmark Judgments" icon={<Gavel className="h-4 w-4" />}>
                    <JudgmentsList analysis={analysis} />
                  </SectionCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-1">
                  <SectionCard id="section-people" title="5. People Involved" icon={<Users className="h-4 w-4" />}>
                    <PeoplePanel detail={detail} />
                  </SectionCard>

                  <SectionCard id="section-evidence" title="6. Evidence Locker" icon={<Paperclip className="h-4 w-4" />}>
                    <EvidenceLocker evidence={detail.evidence} />
                  </SectionCard>
                </div>

                <SectionCard id="section-notes" title="7. Officer Case Notes" icon={<FileText className="h-4 w-4" />}>
                  <div className="space-y-3 print:hidden">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Input updates, suspects interviewed, panchnama copies, or physical check details for this case..."
                      rows={4}
                      className="w-full border border-gold-300 rounded-lg p-3 text-xs focus:outline-none focus:border-maroon-600 font-sans leading-relaxed text-ink-900 bg-ivory/10"
                    />
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <button
                        onClick={handleSaveNotes}
                        className="inline-flex items-center gap-2 bg-gold-600 text-white font-medium px-4 py-2 text-xs rounded hover:bg-gold-700 transition duration-150"
                      >
                        <Save className="h-3.5 w-3.5" /> Save Officer Notes
                      </button>
                      <span className="text-[10px] text-ink-600">Saved to this device only — not yet synced to the server.</span>
                      {saveStatus && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
                          {saveStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden print:block text-xs leading-relaxed text-ink-900 italic border border-ink-900 p-4 rounded-md">
                    {notes ? notes : "No officer notes entered for this case."}
                  </div>
                </SectionCard>

                <p className="text-[10px] text-ink-600 text-center pt-2 print:hidden">
                  Last updated {formatDateTime(detail.complaint.updated_at)}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CaseSummaryPage() {
  return (
    <DashboardLayout>
      {/* 1. Add items-stretch and relative background */}
      <div className="flex items-stretch min-h-[calc(100vh-73px)] bg-ivory">
        
        {/* 2. Wrap Sidebar in a container with the sidebar's dark background */}
        <div className="print:hidden shrink-0 bg-[#3b0813]"> 
          {/* 3. Make the sidebar inner container sticky to viewport */}
          <div className="sticky top-0 h-screen overflow-y-auto">
            <Sidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 print:p-0">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-96">
                <p className="text-ink-600">Loading Case Summary Page...</p>
              </div>
            }
          >
            <CaseSummaryContent />
          </Suspense>
        </main>
      </div>
    </DashboardLayout>
  );
}