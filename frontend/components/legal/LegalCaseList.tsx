"use client";

import { useMemo, useState } from "react";

export interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  clientName: string;
  status:
    | "Case Created"
    | "FIR Registered"
    | "Under Investigation"
    | "Evidence Collection"
    | "Charge Sheet Filed"
    | "Trial"
    | "Closed";
  priority: "High" | "Medium" | "Low";
  assignedTo: string;
  filedDate: string; // ISO date string
  recommendedSections: string[];
}

interface LegalCaseListProps {
  search: string;
  status: string;
  priority: string;
}

// Placeholder data — swap for a real fetch (API route / server action) later.
const MOCK_CASES: LegalCase[] = [
  {
    id: "1",
    caseNumber: "CR-2026-0142",
    title: "State vs. Sharma — Cyber Fraud",
    clientName: "Rohit Sharma",
    status: "Under Investigation",
    priority: "High",
    assignedTo: "Adv. Neha Kapoor",
    filedDate: "2026-06-12",
    recommendedSections: ["IPC 420", "IT Act 66C", "IT Act 66D"],
  },
  {
    id: "2",
    caseNumber: "CR-2026-0158",
    title: "State vs. Patel — Assault",
    clientName: "Vikram Patel",
    status: "FIR Registered",
    priority: "Medium",
    assignedTo: "Adv. Rajesh Mehta",
    filedDate: "2026-07-01",
    recommendedSections: ["IPC 323", "IPC 324"],
  },
  {
    id: "3",
    caseNumber: "CR-2026-0099",
    title: "State vs. Desai — Property Dispute",
    clientName: "Meera Desai",
    status: "Charge Sheet Filed",
    priority: "Low",
    assignedTo: "Adv. Neha Kapoor",
    filedDate: "2026-05-20",
    recommendedSections: ["IPC 447", "IPC 448"],
  },
  {
    id: "4",
    caseNumber: "CR-2026-0175",
    title: "State vs. Iyer — Cheque Bounce",
    clientName: "Karthik Iyer",
    status: "Trial",
    priority: "Medium",
    assignedTo: "Adv. Sana Sheikh",
    filedDate: "2026-04-08",
    recommendedSections: ["NI Act 138"],
  },
  {
    id: "5",
    caseNumber: "CR-2026-0201",
    title: "State vs. Khan — Domestic Violence",
    clientName: "Ayesha Khan",
    status: "Evidence Collection",
    priority: "High",
    assignedTo: "Adv. Rajesh Mehta",
    filedDate: "2026-07-22",
    recommendedSections: ["IPC 498A", "DV Act 12"],
  },
  {
    id: "6",
    caseNumber: "CR-2025-0884",
    title: "State vs. Nair — Theft",
    clientName: "Sunil Nair",
    status: "Closed",
    priority: "Low",
    assignedTo: "Adv. Sana Sheikh",
    filedDate: "2025-11-30",
    recommendedSections: ["IPC 379"],
  },
  {
    id: "7",
    caseNumber: "CR-2026-0210",
    title: "State vs. Verma — Case Intake",
    clientName: "Anjali Verma",
    status: "Case Created",
    priority: "Medium",
    assignedTo: "Adv. Neha Kapoor",
    filedDate: "2026-08-05",
    recommendedSections: [],
  },
];

const STATUS_STYLES: Record<LegalCase["status"], string> = {
  "Case Created": "bg-slate-100 text-slate-700 ring-slate-300",
  "FIR Registered": "bg-blue-50 text-blue-700 ring-blue-200",
  "Under Investigation": "bg-amber-50 text-amber-700 ring-amber-200",
  "Evidence Collection": "bg-purple-50 text-purple-700 ring-purple-200",
  "Charge Sheet Filed": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Trial: "bg-orange-50 text-orange-700 ring-orange-200",
  Closed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const PRIORITY_STYLES: Record<LegalCase["priority"], string> = {
  High: "bg-red-50 text-red-700 ring-red-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-slate-100 text-slate-600 ring-slate-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LegalCaseList({
  search,
  status,
  priority,
}: LegalCaseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return MOCK_CASES.filter((c) => {
      const matchesSearch =
        query === "" ||
        c.title.toLowerCase().includes(query) ||
        c.caseNumber.toLowerCase().includes(query) ||
        c.clientName.toLowerCase().includes(query);
      const matchesStatus = status === "" || c.status === status;
      const matchesPriority = priority === "" || c.priority === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [search, status, priority]);

  if (filteredCases.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-700">No cases match your filters</p>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search, status, or priority filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Case</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Client</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Priority</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Assigned To</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Filed</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Sections</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCases.map((c) => {
              const isExpanded = expandedId === c.id;
              return (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{c.title}</div>
                    <div className="text-xs text-slate-500">{c.caseNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.clientName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[c.status]}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${PRIORITY_STYLES[c.priority]}`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{c.assignedTo}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.filedDate)}</td>
                  <td className="px-4 py-3">
                    {c.recommendedSections.length === 0 ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(isExpanded
                          ? c.recommendedSections
                          : c.recommendedSections.slice(0, 2)
                        ).map((section) => (
                          <span
                            key={section}
                            className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {section}
                          </span>
                        ))}
                        {!isExpanded && c.recommendedSections.length > 2 && (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            +{c.recommendedSections.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Showing {filteredCases.length} of {MOCK_CASES.length} cases
      </div>
    </div>
  );
}