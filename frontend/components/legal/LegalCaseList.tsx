"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface CaseSummary {
  case_id: string;
  case_number?: string;
  complaint_id?: string;
  complaint_number?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  created_at?: string;
}

export default function LegalCaseList({
  initialCases,
  search = "",
  status = "",
  priority = "",
  onSuggest,
}: {
  initialCases?: CaseSummary[];
  search?: string;
  status?: string;
  priority?: string;
  /** Called with a case_id when the user wants AI investigation suggestions for that case. */
  onSuggest?: (caseId: string) => void;
}) {
  const [cases, setCases] = useState<CaseSummary[]>(initialCases || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCases() {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL ??
          "http://localhost:8000";

        if (!initialCases) {
          const response = await axios.get(`${API_BASE}/api/cases`);
          setCases(response.data.cases || []);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load cases"
        );
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  useEffect(() => {
    if (initialCases) {
      setCases(initialCases);
    }
  }, [initialCases]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6">
        Loading cases...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  const filteredCases = cases.filter((caseItem) => {
    const q = search.trim().toLowerCase();

    const matchesSearch =
      q === "" ||
      caseItem.case_number?.toLowerCase().includes(q) ||
      caseItem.complaint_number?.toLowerCase().includes(q) ||
      caseItem.title?.toLowerCase().includes(q) ||
      caseItem.description?.toLowerCase().includes(q);

    const matchesStatus =
      status === "" ||
      caseItem.status?.toLowerCase() === status.toLowerCase();

    const matchesPriority =
      priority === "" ||
      caseItem.priority?.toLowerCase() === priority.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">

        <thead className="bg-slate-100">
          <tr className="text-left text-sm font-semibold text-slate-700">
            <th className="px-6 py-4">Case No.</th>
            <th className="px-6 py-4">Complaint</th>
            <th className="px-6 py-4">Title</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Created</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-200">

          {filteredCases.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="px-6 py-8 text-center text-slate-500"
              >
                No cases found.
              </td>
            </tr>
          ) : (
            filteredCases.map((caseItem) => {

              const status = caseItem.status || "Open";

              const statusClass =
                status === "Closed"
                  ? "bg-emerald-100 text-emerald-700"
                  : status === "Under Investigation"
                  ? "bg-amber-100 text-amber-700"
                  : status === "FIR Registered"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-700";

              const priority = caseItem.priority || "Medium";

              const priorityClass =
                priority === "High"
                  ? "bg-red-100 text-red-700"
                  : priority === "Medium"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";

              return (
                <tr
                  key={caseItem.case_id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-6 py-4 font-semibold">
                    {caseItem.case_number ||
                      caseItem.case_id.slice(0, 8)}
                  </td>

                  <td className="px-6 py-4">
                    <span title={caseItem.complaint_number || undefined}>
                      {caseItem.complaint_number
                        ? caseItem.complaint_number.slice(0, 8)
                        : "-"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {caseItem.title || "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClass}`}
                    >
                      {priority}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                    >
                      {status}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {caseItem.created_at
                      ? new Date(
                          caseItem.created_at
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2 min-w-[120px]">
                      <Link
                        href={`/cases/${caseItem.case_id}`}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm whitespace-nowrap hover:bg-slate-100"
                      >
                        View
                      </Link>

                      <Link
                        href={`/complaints/${caseItem.complaint_id}/legal_sections`}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-medium whitespace-nowrap text-slate-900 hover:bg-amber-600"
                      >
                        Legal Sections
                      </Link>

                      {onSuggest && (
                        <button
                          type="button"
                          onClick={() => onSuggest(caseItem.case_id)}
                          className="rounded-lg bg-maroon-600 px-3 py-2 text-center text-sm font-medium whitespace-nowrap text-white hover:bg-maroon-700"
                        >
                          AI Suggest
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}

        </tbody>
      </table>
    </div>
  );
}