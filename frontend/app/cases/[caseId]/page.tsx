"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  UserPlus,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Sparkles,
  ScrollText,
} from "lucide-react";

import { useAuth } from "../../providers/AuthProvider";
import IOSidebar from "../../../components/layout/io/Sidebar";
import SHOSidebar from "../../../components/layout/sho/Sidebar";
import DashboardLayout from "../../dashboard/layout";

const MOCK_CASES: Record<string, any> = {
  "FIR-2026-041": {
    case_number: "FIR-2026-041",
    fir_date: "2026-06-14",
    complainant_name: "Ananya Patel",
    complainant_phone: "+91 98XXXXXX21",
    complainant_address: "Vastrapur, Ahmedabad",
    category: "Cyber Crime",
    crime_type: "UPI / Net-banking Fraud",
    status: "Investigation Active",
    priority: "High",
    assigned_officer: "SI Vikram Rathore",
    description:
      "Complainant reports unauthorized UPI transactions totaling ₹85,000 from her linked bank account. Suspects victim's device may have been compromised via a phishing link.",
    sections_applied: ["IPC 420", "IT Act 66C", "IT Act 66D"],
    ai_suggestions: [
      "Request transaction logs from the UPI service provider (NPCI) for the last 30 days.",
      "Check for SIM-swap activity linked to the complainant's registered mobile number.",
      "Cross-reference beneficiary account with existing fraud case database.",
    ],
    legal_requests: [
      { type: "Bank Account Freeze Request", status: "Sent", date: "2026-06-15" },
      { type: "CDR Request - Complainant", status: "Pending", date: "2026-06-16" },
    ],
    timeline: [
      { date: "2026-06-14", event: "FIR Registered" },
      { date: "2026-06-14", event: "Case assigned to SI Vikram Rathore" },
      { date: "2026-06-15", event: "Bank account freeze request sent" },
    ],
  },
  "FIR-2026-042": {
    case_number: "FIR-2026-042",
    fir_date: "2026-06-13",
    complainant_name: "Rahul Sharma",
    complainant_phone: "+91 97XXXXXX54",
    complainant_address: "Navrangpura, Ahmedabad",
    category: "Conventional",
    crime_type: "Theft",
    status: "Pending Approvals",
    priority: "Medium",
    assigned_officer: "SI Amit Kumar",
    description:
      "Complainant reports theft of a two-wheeler from outside his residence overnight.",
    sections_applied: ["IPC 379"],
    ai_suggestions: [
      "Pull CCTV footage from nearby residential society cameras.",
      "Check vehicle registration against stolen-vehicle database.",
    ],
    legal_requests: [
      { type: "CCTV Footage Request", status: "Pending", date: "2026-06-13" },
    ],
    timeline: [
      { date: "2026-06-13", event: "FIR Registered" },
      { date: "2026-06-13", event: "Case assigned to SI Amit Kumar" },
    ],
  },
  "FIR-2026-039": {
    case_number: "FIR-2026-039",
    fir_date: "2026-06-10",
    complainant_name: "Vikram Singh",
    complainant_phone: "+91 99XXXXXX02",
    complainant_address: "Bodakdev, Ahmedabad",
    category: "Cyber Crime",
    crime_type: "Phishing / Fake Links",
    status: "Awaiting Service Provider",
    priority: "High",
    assigned_officer: "Unassigned",
    description:
      "Complainant received a fraudulent link impersonating a courier service and entered personal banking details, resulting in unauthorized withdrawal.",
    sections_applied: ["IPC 420", "IT Act 66D"],
    ai_suggestions: [
      "Trace the phishing domain registration details.",
      "Request hosting provider logs for the fake link.",
    ],
    legal_requests: [
      { type: "Domain Takedown Request", status: "Sent", date: "2026-06-11" },
    ],
    timeline: [
      { date: "2026-06-10", event: "FIR Registered" },
      { date: "2026-06-11", event: "Domain takedown request sent" },
    ],
  },
};

const statusStyles: Record<string, string> = {
  "Investigation Active": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Pending Approvals": "bg-amber-50 text-amber-800 border-amber-200",
  "Awaiting Service Provider": "bg-blue-50 text-blue-800 border-blue-200",
};

const priorityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-amber-50 text-amber-700 border-amber-200",
  Low: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function CaseDetailsPage() {
  const params = useParams();
  const caseId = decodeURIComponent(params?.caseId as string);
  const { user } = useAuth();
  const isSHO = user?.role === "SHO";

  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchCase() {
      setLoading(true);
      setError(false);
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
        const response = await fetch(`${API_BASE}/v1/cases/${caseId}/`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setCaseData(data);
      } catch (err) {
        const mock = MOCK_CASES[caseId];
        if (mock) {
          setCaseData(mock);
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }
    if (caseId) fetchCase();
  }, [caseId]);

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-73px)]">
        {isSHO ? <SHOSidebar /> : <IOSidebar />}

        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 max-w-5xl mx-auto space-y-6">
              {/* Back link */}
              <Link
                href="/cases"
                className="inline-flex items-center gap-2 text-sm text-ink-600 hover:text-maroon-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to cases
              </Link>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-6 w-6 text-maroon-600 animate-spin mr-2" />
                  <span className="text-sm text-ink-600">Loading case details...</span>
                </div>
              ) : error || !caseData ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <ShieldAlert className="h-8 w-8 text-gold-300 mb-2" />
                  <p className="font-medium text-ink-900">Case not found</p>
                  <p className="text-sm text-ink-600 mt-1">
                    We couldn't find a case with ID "{caseId}".
                  </p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="font-display text-2xl text-ink-900">
                          {caseData.case_number}
                        </h1>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            statusStyles[caseData.status] ||
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {caseData.status}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            priorityStyles[caseData.priority] ||
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {caseData.priority} Priority
                        </span>
                      </div>
                      <p className="mt-1 text-ink-600">
                        {caseData.crime_type} · {caseData.category}
                      </p>
                    </div>
                  </div>

                  {/* Overview cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-gold-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-ink-600 text-xs font-medium mb-2">
                        <Calendar className="h-4 w-4" />
                        DATE FILED
                      </div>
                      <p className="text-ink-900 font-medium">{caseData.fir_date}</p>
                    </div>

                    <div className="rounded-lg border border-gold-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-ink-600 text-xs font-medium mb-2">
                        <User className="h-4 w-4" />
                        ASSIGNED OFFICER
                      </div>
                      {caseData.assigned_officer === "Unassigned" ? (
                        <Link
                          href="/assign-case"
                          className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 hover:underline font-medium"
                        >
                          <UserPlus className="h-4 w-4" />
                          Assign IO
                        </Link>
                      ) : (
                        <p className="text-ink-900 font-medium">
                          {caseData.assigned_officer}
                        </p>
                      )}
                    </div>

                    <div className="rounded-lg border border-gold-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-ink-600 text-xs font-medium mb-2">
                        <ScrollText className="h-4 w-4" />
                        SECTIONS APPLIED
                      </div>
                      <p className="text-ink-900 font-medium">
                        {caseData.sections_applied?.join(", ") || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Complainant details */}
                  <section className="rounded-lg border border-gold-200 bg-white p-5">
                    <h2 className="font-medium text-ink-900 mb-4">
                      Complainant Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-ink-600 text-xs mb-1">Name</p>
                        <p className="text-ink-900 font-medium">
                          {caseData.complainant_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-600 text-xs mb-1">Phone</p>
                        <p className="text-ink-900 font-medium">
                          {caseData.complainant_phone || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-600 text-xs mb-1">Address</p>
                        <p className="text-ink-900 font-medium">
                          {caseData.complainant_address || "—"}
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Description */}
                  <section className="rounded-lg border border-gold-200 bg-white p-5">
                    <h2 className="font-medium text-ink-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-maroon-600" />
                      Case Description
                    </h2>
                    <p className="text-sm text-ink-800 leading-relaxed">
                      {caseData.description || "No description available."}
                    </p>
                  </section>

                  {/* AI Suggestions */}
                  <section className="rounded-lg border border-gold-200 bg-white p-5">
                    <h2 className="font-medium text-ink-900 mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-maroon-600" />
                      AI Suggestions
                    </h2>
                    {caseData.ai_suggestions?.length ? (
                      <ul className="space-y-2">
                        {caseData.ai_suggestions.map((s: string, i: number) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-ink-800"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-maroon-600 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ink-600">No suggestions yet.</p>
                    )}
                  </section>

                  {/* Legal Requests */}
                  <section className="rounded-lg border border-gold-200 bg-white p-5">
                    <h2 className="font-medium text-ink-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-maroon-600" />
                      Legal Requests
                    </h2>
                    {caseData.legal_requests?.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-ink-900">
                          <thead className="border-b border-gold-200 text-ink-600">
                            <tr>
                              <th className="pb-2 font-medium">Request Type</th>
                              <th className="pb-2 font-medium">Date</th>
                              <th className="pb-2 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gold-100">
                            {caseData.legal_requests.map((r: any, i: number) => (
                              <tr key={i}>
                                <td className="py-2">{r.type}</td>
                                <td className="py-2 text-ink-600">{r.date}</td>
                                <td className="py-2">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                      r.status === "Sent"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : "bg-amber-50 text-amber-800 border-amber-200"
                                    }`}
                                  >
                                    {r.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-ink-600">
                        No legal requests filed yet.
                      </p>
                    )}
                  </section>

                  {/* Timeline */}
                  <section className="rounded-lg border border-gold-200 bg-white p-5">
                    <h2 className="font-medium text-ink-900 mb-4">Case Timeline</h2>
                    {caseData.timeline?.length ? (
                      <ol className="relative border-l border-gold-200 ml-2 space-y-4">
                        {caseData.timeline.map((t: any, i: number) => (
                          <li key={i} className="ml-4">
                            <div className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-maroon-600" />
                            <p className="text-xs text-ink-600">{t.date}</p>
                            <p className="text-sm text-ink-900 font-medium">
                              {t.event}
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-ink-600">No timeline events yet.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}