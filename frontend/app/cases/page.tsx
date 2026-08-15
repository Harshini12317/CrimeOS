"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ShieldAlert,
  Loader2,
  Eye,
} from "lucide-react";

import IOSidebar from "../../components/layout/io/Sidebar";
import DashboardLayout from "../dashboard/layout";

interface CaseItem {
  case_id: string;
  complaint_id: string | null;
  case_number: string | null;
  title: string | null;
  status: string | null;
  priority: string | null;
  description: string | null;
  current_stage: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function getStatusStyle(status: string | null) {
  switch (status?.toLowerCase()) {
    case "open":
      return "bg-blue-50 text-blue-800 border-blue-200";

    case "assigned":
      return "bg-purple-50 text-purple-800 border-purple-200";

    case "investigation":
    case "under investigation":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";

    case "legally cleared":
      return "bg-green-50 text-green-800 border-green-200";

    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getPriorityStyle(priority: string | null) {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-50 text-red-800 border-red-200";

    case "medium":
      return "bg-amber-50 text-amber-800 border-amber-200";

    case "low":
      return "bg-green-50 text-green-800 border-green-200";

    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function formatDate(date: string | null) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        setLoading(true);
        setError("");

        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:8000";

        const response = await fetch(
          `${API_BASE}/api/cases/my-cases`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || "Failed to load cases."
          );
        }

        setCases(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("IO cases error:", err);

        setCases([]);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load cases."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  const filteredCases = cases.filter((item) => {
    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      !searchText ||
      (item.case_number || "")
        .toLowerCase()
        .includes(searchText) ||
      (item.case_id || "")
        .toLowerCase()
        .includes(searchText) ||
      (item.title || "")
        .toLowerCase()
        .includes(searchText) ||
      (item.complaint_id || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      item.status?.toLowerCase() ===
        statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-73px)]">

        {/* ================================================= */}
        {/* IO SIDEBAR                                        */}
        {/* ================================================= */}
        <div className="sticky top-0 h-screen overflow-y-auto">
        <IOSidebar />
        </div>

        {/* ================================================= */}
        {/* MAIN CONTENT                                      */}
        {/* ================================================= */}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-7xl space-y-8 p-8">

              {/* ================================================= */}
              {/* HEADER                                            */}
              {/* ================================================= */}

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-700">
                    Investigation Officer
                  </p>

                  <h1 className="mt-1 font-display text-2xl text-ink-900">
                    My Assigned Cases
                  </h1>

                  <p className="mt-1 text-ink-600">
                    Cases assigned to you by the Station House Officer.
                  </p>
                </div>

                {!loading && !error && (
                  <div className="rounded-lg border border-gold-200 bg-white px-5 py-3">
                    <p className="text-xs text-ink-600">
                      Assigned Cases
                    </p>

                    <p className="text-2xl font-semibold text-maroon-700">
                      {cases.length}
                    </p>
                  </div>
                )}

              </div>

              {/* ================================================= */}
              {/* SEARCH + FILTER                                   */}
              {/* ================================================= */}

              <div className="flex flex-col gap-3 rounded-lg border border-gold-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="relative w-full max-w-md">

                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />

                  <input
                    type="text"
                    placeholder="Search by case number, title, complaint..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    className="w-full rounded-md border border-gold-200 bg-white py-2 pl-9 pr-4 text-sm text-ink-900 outline-none focus:border-maroon-600"
                  />

                </div>

                <div className="flex items-center gap-2">

                  <Filter className="h-4 w-4 text-ink-600" />

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value)
                    }
                    className="rounded-md border border-gold-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-maroon-600"
                  >
                    <option value="ALL">
                      All Status
                    </option>

                    <option value="Open">
                      Open
                    </option>

                    <option value="Assigned">
                      Assigned
                    </option>

                    <option value="Investigation">
                      Investigation
                    </option>

                    <option value="Under Investigation">
                      Under Investigation
                    </option>

                    <option value="Legally Cleared">
                      Legally Cleared
                    </option>

                    <option value="Closed">
                      Closed
                    </option>
                  </select>

                </div>

              </div>

              {/* ================================================= */}
              {/* ERROR                                             */}
              {/* ================================================= */}

              {!loading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-5">

                  <div className="flex items-start gap-3">

                    <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />

                    <div>
                      <p className="font-medium text-red-800">
                        Unable to load cases
                      </p>

                      <p className="mt-1 text-sm text-red-700">
                        {error}
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* ================================================= */}
              {/* CASE SECTION                                      */}
              {/* ================================================= */}

              <section className="rounded-lg border border-gold-200 bg-white p-5">

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <h2 className="font-medium text-ink-900">
                      Assigned Cases
                    </h2>

                    <p className="mt-1 text-sm text-ink-600">
                      Only cases assigned to your account are shown.
                    </p>
                  </div>

                  {!loading && !error && (
                    <span className="text-sm text-ink-500">
                      {filteredCases.length} result
                      {filteredCases.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  )}

                </div>

                {/* ================================================= */}
                {/* LOADING                                           */}
                {/* ================================================= */}

                {loading && (
                  <div className="flex items-center justify-center py-12">

                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-maroon-600" />

                    <span className="text-sm text-ink-600">
                      Loading cases...
                    </span>

                  </div>
                )}

                {/* ================================================= */}
                {/* EMPTY                                             */}
                {/* ================================================= */}

                {!loading &&
                  !error &&
                  filteredCases.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-center">

                      <ShieldAlert className="mb-3 h-9 w-9 text-gold-400" />

                      <p className="font-medium text-ink-900">
                        No cases found
                      </p>

                      <p className="mt-1 text-sm text-ink-600">
                        {cases.length === 0
                          ? "No cases have been assigned to you yet."
                          : "No cases match your search or filter."}
                      </p>

                    </div>
                  )}

                {/* ================================================= */}
                {/* TABLE                                             */}
                {/* ================================================= */}

                {!loading &&
                  !error &&
                  filteredCases.length > 0 && (
                    <div className="overflow-x-auto">

                      <table className="w-full text-left text-sm text-ink-900">

                        <thead className="border-b border-gold-200 text-ink-600">

                          <tr>

                            <th className="pb-3 font-medium">
                              Case
                            </th>

                            <th className="pb-3 font-medium">
                              Title
                            </th>

                            <th className="pb-3 font-medium">
                              Complaint
                            </th>

                            <th className="pb-3 font-medium">
                              Priority
                            </th>

                            <th className="pb-3 font-medium">
                              Status
                            </th>

                            <th className="pb-3 font-medium">
                              Stage
                            </th>

                            <th className="pb-3 font-medium">
                              Created
                            </th>

                            <th className="pb-3 text-right font-medium">
                              Action
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-gold-100">

                          {filteredCases.map((item) => (

                            <tr
                              key={item.case_id}
                              className="transition hover:bg-gold-50/30"
                            >

                              {/* CASE */}

                              <td className="py-4">

                                <p className="font-medium text-maroon-700">
                                  {item.case_number ||
                                    item.case_id}
                                </p>

                                {item.case_number && (
                                  <p className="mt-0.5 max-w-[150px] truncate text-xs text-ink-500">
                                    {item.case_id}
                                  </p>
                                )}

                              </td>

                              {/* TITLE */}

                              <td className="py-4">

                                <p className="max-w-[220px] truncate font-medium text-ink-900">
                                  {item.title ||
                                    "Untitled Case"}
                                </p>

                                {item.description && (
                                  <p className="mt-1 max-w-[220px] truncate text-xs text-ink-500">
                                    {item.description}
                                  </p>
                                )}

                              </td>

                              {/* COMPLAINT */}

                              <td className="py-4 text-ink-700">
                                {item.complaint_id || "-"}
                              </td>

                              {/* PRIORITY */}

                              <td className="py-4">

                                {item.priority ? (
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPriorityStyle(
                                      item.priority
                                    )}`}
                                  >
                                    {item.priority}
                                  </span>
                                ) : (
                                  "-"
                                )}

                              </td>

                              {/* STATUS */}

                              <td className="py-4">

                                {item.status ? (
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusStyle(
                                      item.status
                                    )}`}
                                  >
                                    {item.status}
                                  </span>
                                ) : (
                                  "-"
                                )}

                              </td>

                              {/* STAGE */}

                              <td className="py-4 text-ink-700">
                                {item.current_stage || "-"}
                              </td>

                              {/* CREATED */}

                              <td className="py-4 text-ink-600">
                                {formatDate(
                                  item.created_at
                                )}
                              </td>

                              {/* ACTION */}

                              <td className="py-4 text-right">

                                <Link
                                  href={`/cases/${encodeURIComponent(
                                    item.case_id
                                  )}`}
                                  className="inline-flex items-center gap-1.5 font-medium text-maroon-600 transition hover:text-maroon-800 hover:underline"
                                >
                                  <Eye className="h-4 w-4" />
                                  View
                                </Link>

                              </td>

                            </tr>

                          ))}

                        </tbody>

                      </table>

                    </div>
                  )}

              </section>

            </div>
          </main>
        </div>

      </div>
    </DashboardLayout>
  );
}