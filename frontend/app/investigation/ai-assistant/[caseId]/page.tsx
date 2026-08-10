"use client";

import { use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import { LucideIcon, FileText, Sparkles, Scale, ArrowLeft, ArrowRight, ShieldCheck, Clock, FileSpreadsheet } from "lucide-react";

interface CaseAssistantOption {
  href: string;
  symbol: LucideIcon;
  title: string;
  description: string;
  badge?: string;
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
      symbol: FileText,
      title: "Read Evidence Files",
      description:
        "Upload an FIR audio recording, scanned document, or photo. We'll extract and translate the text so you don't have to type it out.",
      badge: "OCR & Audio",
    },
    {
      href: `/investigation/ai-assistant/${caseId}/investigation-sop`,
      symbol: Sparkles,
      title: "Suggested Investigation Steps",
      description:
        "Get an AI-recommended investigation path for this case, with the legal sections and past judgments that support it. Detailed step-by-step guidance is available on request.",
      badge: "Guided SOP",
    },
    {
      href: legalSectionsHref,
      symbol: Scale,
      title: "Relevant Legal Sections",
      description:
        "See which BNS/BNSS/BSA and IPC/CrPC/IEA sections apply to this complaint, matched to the case facts, with related case law.",
      badge: "Statutory Match",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex min-h-screen bg-slate-50/50">
        <Sidebar />
        
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Top Navigation & Title */}
          <div>
            <Link
              href="/ai-assistant"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-maroon-700 hover:text-maroon-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to AI Assistant
            </Link>

            <div className="mt-3">
              <h1 className="text-2xl font-bold text-ink-900">Case Assistant Hub</h1>
              <p className="mt-1 text-xs font-mono text-ink-500">Case ID: {caseId}</p>
              <p className="mt-2 text-sm text-ink-600">
                Select an investigation module below. Each tool operates independently to assist your current workflow stage.
              </p>
            </div>
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: Primary Action Cards */}
            <div className="lg:col-span-2 space-y-4">
              {options.map((option) => {
                const Icon = option.symbol;
                return (
                  <Link
                    key={option.href}
                    href={option.href}
                    className="group flex items-start gap-5 rounded-xl border border-gold-200 bg-white p-6 shadow-sm transition-all hover:border-maroon-600 hover:shadow-md"
                  >
                    {/* Icon Badge Container */}
                    <div className="rounded-xl bg-gold-50 p-3.5 text-maroon-700 group-hover:bg-maroon-700 group-hover:text-white transition-colors shrink-0">
                      <Icon className="h-7 w-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-semibold text-ink-900 group-hover:text-maroon-900 transition-colors">
                            {option.title}
                          </h2>
                          {option.badge && (
                            <span className="rounded-md bg-gold-100/80 px-2 py-0.5 text-[10px] font-medium text-maroon-800">
                              {option.badge}
                            </span>
                          )}
                        </div>
                        
                        <span className="text-maroon-700 group-hover:translate-x-1 transition-transform shrink-0">
                          <ArrowRight className="h-5 w-5" />
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-ink-600 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Right Column: Case Overview & Context Sidebar */}
            <div className="space-y-4">
              
              {/* Case Metadata Panel */}
              <div className="rounded-xl border border-gold-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gold-100 pb-3">
                  <ShieldCheck className="h-4 w-4 text-maroon-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-900">
                    Active Case Snapshot
                  </h3>
                </div>

                <dl className="space-y-3 text-xs">
                  <div>
                    <dt className="text-ink-400 font-medium">Case Reference Number</dt>
                    <dd className="font-mono text-ink-900 font-semibold mt-0.5 truncate bg-slate-50 p-2 rounded border border-slate-200/60">
                      {caseId}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-ink-400 font-medium">Linked Complaint ID</dt>
                    <dd className="text-ink-900 font-medium mt-0.5">
                      {complaintId ? (
                        <span className="inline-flex items-center gap-1 font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          {complaintId}
                        </span>
                      ) : (
                        <span className="text-ink-400 italic">No complaint linked yet</span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-ink-400 font-medium">AI Readiness Status</dt>
                    <dd className="inline-flex items-center gap-1.5 text-emerald-700 font-medium mt-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Ready for Processing
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Informational Guidance Box */}
              {!complaintId && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-950">Notice</p>
                    <p className="mt-0.5 text-amber-900/90">
                      No complaint is linked to this case. Some tools like statutory legal matching may require a linked FIR or complaint transcript to run full analysis.
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}