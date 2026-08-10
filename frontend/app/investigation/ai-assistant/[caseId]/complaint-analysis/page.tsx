"use client";

import { use, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";

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

function UploadCard({
  title,
  description,
  accept,
  endpoint,
}: {
  title: string;
  description: string;
  accept: string;
  endpoint: string;
}) {
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

  const mainText = result ? pickMainText(result) : null;
  const otherEntries = result
    ? Object.entries(result).filter(
        ([key, value]) =>
          key !== mainText?.key &&
          value !== null &&
          value !== undefined &&
          typeof value !== "object"
      )
    : [];

  return (
    <div className="rounded-lg border border-gold-200 bg-white p-5">
      <h2 className="font-medium text-ink-900">{title}</h2>
      <p className="mt-1 text-sm text-ink-600">{description}</p>

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

      {result && (
        <div className="mt-4 space-y-3">
          {mainText ? (
            <div>
              <h3 className="text-sm font-medium text-ink-900">{mainText.label}</h3>
              <p className="mt-1 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm text-ink-700">
                {mainText.value}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-500">
              The system responded, but didn&apos;t return recognizable text. Details below.
            </p>
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
      )}
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
            <h1 className="text-2xl font-semibold text-ink-900">Read Evidence Files</h1>
            <p className="mt-1 text-sm text-ink-500">Case {caseId}</p>
            <p className="mt-2 text-sm text-ink-600">
              Upload a recording, scanned document, or photo below. We&apos;ll extract and translate the
              text. This is shown to you here — it isn&apos;t saved to the case record automatically.
            </p>
          </div>

          <div className="space-y-4">
            <UploadCard
              title="Audio recording"
              description="A voice statement or call recording. We'll transcribe and translate it."
              accept="audio/*"
              endpoint="/api/ingestion/audio/upload"
            />
            <UploadCard
              title="Scanned document (PDF)"
              description="A written complaint or document. We'll extract the text from it."
              accept="application/pdf"
              endpoint="/api/ingestion/pdf/upload"
            />
            <UploadCard
              title="Photo"
              description="A photo of a handwritten or printed document. We'll read the text in it."
              accept="image/*"
              endpoint="/api/ingestion/image/upload"
            />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}