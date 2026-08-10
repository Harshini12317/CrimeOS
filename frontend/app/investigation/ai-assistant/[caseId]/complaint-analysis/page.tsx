"use client";

import { use, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import { LucideIcon, Mic, FileText, Image as ImageIcon } from "lucide-react";

// ---------- shape returned by the ingestion pipeline (audio/pdf/image) ----------

interface ComplainantDetails {
  name?: string;
  address?: string;
  phone?: string;
  id_proof?: string;
}

interface IncidentDetails {
  date?: string;
  location?: string;
  description?: string;
}

interface ComplaintSections {
  complainant_details?: ComplainantDetails;
  incident_details?: IncidentDetails;
  accused_details?: Array<Record<string, unknown>>;
  narrative_text?: string;
}

interface EntityGroups {
  people?: string[];
  locations?: string[];
  dates?: string[];
  phone_numbers?: string[];
  organizations?: string[];
}

interface ConfidenceFlags {
  ocr_used?: boolean;
  stt_used?: boolean;
  llm_extraction_used?: boolean;
  needs_human_review?: boolean;
}

interface DocumentMeta {
  source_file?: string;
  languages_detected?: string[];
  page_count?: number;
  extraction_methods?: string[];
}

interface ComplaintExtraction {
  document_meta?: DocumentMeta;
  sections?: ComplaintSections;
  entities?: EntityGroups;
  key_facts?: string[];
  confidence_flags?: ConfidenceFlags;
  [key: string]: unknown;
}

function isComplaintExtraction(data: unknown): data is ComplaintExtraction {
  return (
    !!data &&
    typeof data === "object" &&
    "sections" in (data as Record<string, unknown>) &&
    typeof (data as Record<string, unknown>).sections === "object"
  );
}

/** label:value rows, skipping anything empty */
function LabeledFields({ fields }: { fields: Array<[string, string | undefined]> }) {
  const present = fields.filter(([, v]) => v && v.trim().length > 0);
  if (present.length === 0) {
    return <p className="text-sm text-ink-500">Nothing extracted for this section.</p>;
  }
  return (
    <ul className="space-y-1 text-sm text-ink-700">
      {present.map(([label, value]) => (
        <li key={label}>
          <span className="font-medium text-ink-900">{label}:</span> {value}
        </li>
      ))}
    </ul>
  );
}

function TagGroup({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <span className="text-xs font-medium text-ink-700">{label}: </span>
      <span className="inline-flex flex-wrap gap-1.5 align-middle">
        {items.map((item, i) => (
          <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            {item}
          </span>
        ))}
      </span>
    </div>
  );
}

function ComplaintExtractionView({ data }: { data: ComplaintExtraction }) {
  const { document_meta, sections, entities, key_facts, confidence_flags } = data;

  return (
    <div className="space-y-4">
      {confidence_flags?.needs_human_review && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          This extraction is flagged for review — please check it against the original file before
          relying on it.
        </p>
      )}

      <div>
        <h3 className="text-sm font-medium text-ink-900">Narrative</h3>
        {sections?.narrative_text ? (
          <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-ink-700">
            {sections.narrative_text}
          </p>
        ) : (
          <p className="mt-1 text-sm text-ink-500">No narrative text was extracted.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-ink-900">Complainant</h3>
          <div className="mt-1">
            <LabeledFields
              fields={[
                ["Name", sections?.complainant_details?.name],
                ["Address", sections?.complainant_details?.address],
                ["Phone", sections?.complainant_details?.phone],
                ["ID proof", sections?.complainant_details?.id_proof],
              ]}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-ink-900">Incident</h3>
          <div className="mt-1">
            <LabeledFields
              fields={[
                ["Date", sections?.incident_details?.date],
                ["Location", sections?.incident_details?.location],
                ["Description", sections?.incident_details?.description],
              ]}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-ink-900">Accused</h3>
        {sections?.accused_details && sections.accused_details.length > 0 ? (
          <ul className="mt-1 space-y-1 text-sm text-ink-700">
            {sections.accused_details.map((accused, i) => (
              <li key={i}>{JSON.stringify(accused)}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-ink-500">No accused named in the document.</p>
        )}
      </div>

      {!!key_facts?.length && (
        <div>
          <h3 className="text-sm font-medium text-ink-900">Key facts</h3>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-700">
            {key_facts.map((fact, i) => (
              <li key={i}>{fact}</li>
            ))}
          </ul>
        </div>
      )}

      {entities && (
        <div className="space-y-1.5">
          <h3 className="text-sm font-medium text-ink-900">Mentioned in the document</h3>
          <TagGroup label="People" items={entities.people} />
          <TagGroup label="Locations" items={entities.locations} />
          <TagGroup label="Dates" items={entities.dates} />
          <TagGroup label="Phone numbers" items={entities.phone_numbers} />
          <TagGroup label="Organizations" items={entities.organizations} />
        </div>
      )}

      {document_meta && (
        <p className="border-t border-gold-100 pt-2 text-xs text-ink-500">
          {[
            document_meta.source_file,
            document_meta.page_count ? `${document_meta.page_count} page(s)` : null,
            document_meta.languages_detected?.length
              ? `Languages: ${document_meta.languages_detected.join(", ")}`
              : null,
            document_meta.extraction_methods?.length
              ? `Method: ${document_meta.extraction_methods.join(", ")}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}

// ---------- image normalizer ----------

interface ImageExtractionResult {
  document_meta?: {
    source_file?: string;
  };
  text_detected?: Array<{ text: string }>;
  evidence?: Array<{
    description?: string;
    location?: string;
  }>;
  search_keywords?: string[];
  [key: string]: unknown;
}

/**
 * Transforms raw image recognition output into the standard ComplaintExtraction structure.
 */
function normalizeImageExtraction(data: Record<string, unknown>): ComplaintExtraction | null {
  if (!("text_detected" in data) || !Array.isArray(data.text_detected)) {
    return null;
  }

  const imageData = data as unknown as ImageExtractionResult;

  const narrativeText = imageData.text_detected
    ?.map((item) => item.text)
    .filter(Boolean)
    .join("\n");

  const firstEvidence = imageData.evidence?.[0];

  return {
    document_meta: {
      source_file: imageData.document_meta?.source_file,
      extraction_methods: ["Image OCR", "Vision AI"],
    },
    sections: {
      narrative_text: narrativeText,
      complainant_details: {},
      incident_details: {
        location: firstEvidence?.location,
        description: firstEvidence?.description,
      },
      accused_details: [],
    },
    key_facts: imageData.search_keywords,
    confidence_flags: {
      ocr_used: true,
      needs_human_review: false,
    },
  };
}

// ---------- fallback for a plain { text: "..." }-shaped response ----------

interface ExtractionResult {
  [key: string]: unknown;
}

const TEXT_FIELD_PRIORITY: { key: string; label: string }[] = [
  { key: "translated_text", label: "Translated text" },
  { key: "transcript", label: "Transcript" },
  { key: "extracted_text", label: "Extracted text" },
  { key: "ocr_text", label: "Extracted text" },
  { key: "text", label: "Extracted text" },
  { key: "content", label: "Extracted text" },
];

function pickMainText(data: ExtractionResult): { key: string; label: string; value: string } | null {
  for (const { key, label } of TEXT_FIELD_PRIORITY) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return { key, label, value };
    }
  }
  return null;
}

function FallbackExtractionView({ data }: { data: ExtractionResult }) {
  const mainText = pickMainText(data);
  const otherEntries = Object.entries(data).filter(
    ([key, value]) => key !== mainText?.key && value !== null && value !== undefined && typeof value !== "object"
  );

  if (!mainText && otherEntries.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        The system responded, but didn&apos;t return recognizable text. Check the raw response below.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {mainText && (
        <div>
          <h3 className="text-sm font-medium text-ink-900">{mainText.label}</h3>
          <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-ink-700">
            {mainText.value}
          </p>
        </div>
      )}
      {otherEntries.length > 0 && (
        <ul className="space-y-1 text-xs text-ink-500">
          {otherEntries.map(([key, value]) => (
            <li key={key}>
              <span className="font-medium text-ink-700">{key}:</span> {String(value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- upload card ----------

interface UploadCardProps {
  symbol: LucideIcon;
  title: string;
  description: string;
  accept: string;
  endpoint: string;
}

function UploadCard({
  symbol: SymbolIcon,
  title,
  description,
  accept,
  endpoint,
}: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-gold-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-maroon-50 text-maroon-700">
          <SymbolIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-medium text-ink-900">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-600">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept={accept}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-ink-700"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="rounded-md bg-maroon-600 px-4 py-2 text-sm font-medium text-white
                     hover:bg-maroon-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Processing…" : "Extract text"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-md border border-maroon-200 bg-maroon-50 px-3 py-2 text-sm text-risk">
          {error}
        </p>
      )}

      {result && (() => {
        const normalizedData = isComplaintExtraction(result)
          ? result
          : normalizeImageExtraction(result as Record<string, unknown>);

        return (
          <div className="mt-4 space-y-3">
            {normalizedData ? (
              <ComplaintExtractionView data={normalizedData} />
            ) : (
              <FallbackExtractionView data={result} />
            )}

            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="text-xs font-medium text-maroon-700 hover:text-maroon-900"
            >
              {showRaw ? "Hide raw response" : "Show raw response (for troubleshooting)"}
            </button>

            {showRaw && (
              <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default function ComplaintAnalysisPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);

  return (
    <DashboardLayout>
      <div className="flex min-h-screen bg-slate-50">
        
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto">
          <Link
            href={`/investigation/ai-assistant/${caseId}`}
            className="text-sm font-medium text-maroon-700 hover:text-maroon-900"
          >
            ← Back to Case Assistant
          </Link>

          <div className="mt-3 mb-6">
            <h1 className="text-2xl font-semibold text-ink-900">Read Evidence Files</h1>
            <p className="mt-1 text-sm text-ink-500">Case {caseId}</p>
            <p className="mt-2 text-sm text-ink-600">
              Upload a recording, scanned document, or photo below. We&apos;ll extract the complainant,
              incident, and key facts from it. This is shown to you here — it isn&apos;t saved to the case
              record automatically.
            </p>
          </div>

          <div className="space-y-4">
            <UploadCard
              symbol={Mic}
              title="Audio recording"
              description="A voice statement or call recording. We'll transcribe and extract the details."
              accept="audio/*"
              endpoint="/api/ingestion/audio/upload"
            />
            <UploadCard
              symbol={FileText}
              title="Scanned document (PDF)"
              description="A written complaint or document. We'll extract the details from it."
              accept="application/pdf"
              endpoint="/api/ingestion/pdf/upload"
            />
            <UploadCard
              symbol={ImageIcon}
              title="Photo"
              description="A photo of a handwritten or printed document. We'll read the details in it."
              accept="image/*"
              endpoint="/api/ingestion/image/upload"
            />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}