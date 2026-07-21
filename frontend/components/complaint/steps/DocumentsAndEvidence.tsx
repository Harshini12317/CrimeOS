"use client";

import { FileText, Paperclip, CheckCircle2 } from "lucide-react";
import FileUploader from "../upload/FileUploader";
import { UploadedFile } from "../types";

interface Props {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onExtractClick: () => void;
  loading: boolean;
}

export default function DocumentsAndEvidence({ files, onFilesChange, onExtractClick, loading }: Props) {
  return (
    <div className="space-y-6 rounded-lg border border-gold-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">Step 1</p>
        <h2 className="mt-1 text-xl font-display font-semibold text-ink-900">Documents and evidence</h2>
        <p className="mt-1 text-sm text-ink-600">
          Upload supporting documents and capture them as evidence for this complaint.
        </p>
      </div>

      <FileUploader
        files={files}
        onFilesChange={onFilesChange}
        onExtractClick={onExtractClick}
        loading={loading}
      />

      {files.length > 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold">Evidence prepared for submission</p>
          </div>
          <div className="mt-3 space-y-2">
            {files.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-emerald-100 bg-white px-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-700"><FileText className="h-4 w-4" /></div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.file.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-ivory px-2 py-1 text-xs text-ink-600 border border-gold-100">
                  <Paperclip className="h-3 w-3" /> Attached
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}