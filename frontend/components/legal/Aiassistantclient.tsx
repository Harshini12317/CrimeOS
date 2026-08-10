"use client";

import { useRouter } from "next/navigation";
import LegalCaseList from "./LegalCaseList";

export default function AiAssistantClient() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-900">Investigation Assistant</h1>
        <p className="mt-1 text-sm text-ink-600">
          Select a case to review evidence, prepare investigation steps, or get legal guidance.
        </p>
      </div>

      <LegalCaseList
        onSuggest={(caseId, complaintId) => {
          const query = complaintId ? `?complaintId=${encodeURIComponent(complaintId)}` : "";
          router.push(`/investigation/ai-assistant/${caseId}${query}`);
        }}
      />
    </div>
  );
}