"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";

interface CaseAssistantOption {
  href: string;
  title: string;
  description: string;
}

export default function CaseAssistantHubPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = use(params);
  const searchParams = useSearchParams();
  const complaintId = searchParams.get("complaintId");

  const legalSectionsHref = complaintId
    ? `/investigation/ai-assistant/${caseId}/legal-sections?complaintId=${encodeURIComponent(complaintId)}`
    : `/investigation/ai-assistant/${caseId}/legal-sections`;

  const options: CaseAssistantOption[] = [
    {
      href: `/investigation/ai-assistant/${caseId}/complaint-analysis`,
      title: "Read Evidence Files",
      description:
        "Upload an FIR audio recording, scanned document, or photo. We'll extract and translate the text so you don't have to type it out.",
    },
    {
      href: `/investigation/ai-assistant/${caseId}/investigation-sop`,
      title: "Suggested Investigation Steps",
      description:
        "Get an AI-recommended investigation path for this case, with the legal sections and past judgments that support it. Detailed step-by-step guidance is available on request.",
    },
    {
      href: legalSectionsHref,
      title: "Relevant Legal Sections",
      description:
        "See which BNS/BNSS/BSA and IPC/CrPC/IEA sections apply to this complaint, matched to the case facts, with related case law.",
    },
  ];

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
            <h1 className="text-2xl font-semibold text-ink-900">Case Assistant</h1>
            <p className="mt-1 text-sm text-ink-500">Case {caseId}</p>
            <p className="mt-2 text-sm text-ink-600">
              Choose what you need. Each option works on its own — you don&apos;t need to go through all three.
            </p>
          </div>

          <div className="space-y-4">
            {options.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                className="block rounded-lg border border-gold-200 bg-white p-5 transition-colors hover:border-maroon-300 hover:bg-gold-50/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium text-ink-900">{option.title}</h2>
                    <p className="mt-1 text-sm text-ink-600">{option.description}</p>
                  </div>
                  <span className="mt-1 shrink-0 text-maroon-700" aria-hidden="true">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {!complaintId && (
            <p className="mt-4 text-xs text-ink-500">
              Note: no complaint is linked to this case yet, so &quot;Relevant Legal Sections&quot; may not have
              anything to analyze until one is.
            </p>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}