"use client";

import { useRouter } from "next/navigation";
import LegalCaseList from "./LegalCaseList";

export default function AiAssistantClient() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-900">AI Investigation Assistant</h1>
        <p className="mt-1 text-sm text-ink-600">
          Pick a case below to get an AI-suggested investigation path, relevant
          legal sections, and step-by-step guidance — no need to enter a case ID.
        </p>
      </div>

      <LegalCaseList
        onSuggest={(caseId) => router.push(`/investigation/ai-assistant/${caseId}`)}
      />
    </div>
  );
}