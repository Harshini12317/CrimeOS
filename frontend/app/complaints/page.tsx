"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SHOSidebar from "@/components/layout/sho/Sidebar";
import DashboardLayout from "../dashboard/layout";
import {
  Search,
  Eye,
  MapPin,
  CalendarDays,
  RefreshCw,
  UserPlus,
} from "lucide-react";

interface Complaint {
  complaint_id: string;
  complaint_number: string;
  complaint_type: string;
  crime_category: string;
  crime_subcategory: string;
  priority: string;

  incident_date?: string | null;
  incident_time?: string | null;

  location?: string | null;
  description: string;

  status: string;

  created_at?: string | null;
  updated_at?: string | null;
}

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // ============================================================
  // FETCH COMPLAINTS
  // ============================================================

  async function fetchComplaints() {
    try {
      setLoading(true);
      setError("");

      const apiUrl =
        process.env.BACKEND_API_URL ||
        "http://localhost:8000";

      const response = await fetch(
        `${apiUrl}/api/complaints`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch complaints (${response.status})`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid response received from complaints API."
        );
      }

      setComplaints(data);
    } catch (err) {
      console.error(
        "Failed to fetch complaints:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load complaints."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ============================================================
  // FILTER
  // ============================================================

  const filteredComplaints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return complaints.filter((complaint) => {
      const matchesSearch =
        !query ||
        complaint.complaint_number
          ?.toLowerCase()
          .includes(query) ||
        complaint.crime_category
          ?.toLowerCase()
          .includes(query) ||
        complaint.crime_subcategory
          ?.toLowerCase()
          .includes(query) ||
        complaint.location
          ?.toLowerCase()
          .includes(query) ||
        complaint.description
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        normalizeStatus(complaint.status) ===
          normalizeStatus(statusFilter);

      const matchesPriority =
        priorityFilter === "All" ||
        normalizeStatus(complaint.priority) ===
          normalizeStatus(priorityFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [
    complaints,
    search,
    statusFilter,
    priorityFilter,
  ]);

  // ============================================================
  // PAGE
  // ============================================================

  return (
  <DashboardLayout>
    <div className="flex min-h-full bg-ivory">
      <div className="shrink-0 w-64">
    <SHOSidebar />
  </div>

      <main className="min-w-0 flex-1 px-8 py-8">
        <div className="mx-auto max-w-[1400px]">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}
          <div className="mb-6 rounded-lg border border-gold-200 bg-white px-6 py-5">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-700">
                  Complaint Management
                </p>
                <h1 className="mt-1 font-serif text-2xl text-ink-900">
                  Registered Complaints
                </h1>
                <p className="mt-1 text-sm text-ink-600">
                  Review complaints registered at this station and manage case assignment.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchComplaints}
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-maroon-800 px-4 py-2.5 text-sm font-medium text-ivory transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {/* ================================================== */}
          {/* SEARCH + FILTERS */}
          {/* ================================================== */}
          <div className="rounded-lg border border-gold-200 bg-white p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
              Search & Filters
            </p>

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search complaint number, crime, location..."
                  className="w-full rounded-md border border-gold-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-maroon-700"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-md border border-gold-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none focus:border-maroon-700"
              >
                <option value="All">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Registered">Registered</option>
                <option value="Assigned">Assigned</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Closed">Closed</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(event) => setPriorityFilter(event.target.value)}
                className="rounded-md border border-gold-200 bg-white px-4 py-2.5 text-sm text-ink-800 outline-none focus:border-maroon-700"
              >
                <option value="All">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* ================================================== */}
          {/* COUNT + STATUS LEGEND */}
          {/* ================================================== */}
          <div className="my-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-600">
              Showing <span className="font-semibold text-ink-900">{filteredComplaints.length}</span> of{" "}
              <span className="font-semibold text-ink-900">{complaints.length}</span> complaints
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <StatusLegend label="Registered" status="Registered" />
              <StatusLegend label="Assigned" status="Assigned" />
              <StatusLegend label="Investigation" status="Under Investigation" />
              <StatusLegend label="Closed" status="Closed" />
            </div>
          </div>

          {/* ================================================== */}
          {/* LOADING */}
          {/* ================================================== */}
          {loading && (
            <div className="rounded-lg border border-gold-200 bg-white p-14 text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gold-200 border-t-maroon-800" />
              <p className="mt-4 text-sm text-ink-600">Loading complaints...</p>
            </div>
          )}

          {/* ================================================== */}
          {/* ERROR */}
          {/* ================================================== */}
          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="font-medium text-red-900">Unable to load complaints</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                type="button"
                onClick={fetchComplaints}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-maroon-800 px-4 py-2 text-sm font-medium text-ivory transition hover:bg-maroon-700"
              >
                <RefreshCw size={15} />
                Try Again
              </button>
            </div>
          )}

          {/* ================================================== */}
          {/* EMPTY */}
          {/* ================================================== */}
          {!loading && !error && filteredComplaints.length === 0 && (
            <div className="rounded-lg border border-gold-200 bg-white p-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-maroon-50">
                <Search size={20} className="text-maroon-800" />
              </div>
              <h3 className="mt-4 font-serif text-lg text-ink-900">No complaints found</h3>
              <p className="mt-1 text-sm text-ink-600">
                {complaints.length === 0
                  ? "No complaints have been registered yet."
                  : "No complaints match your current search or filters."}
              </p>
            </div>
          )}

          {/* ================================================== */}
          {/* TABLE */}
          {/* ================================================== */}
          {!loading && !error && filteredComplaints.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-gold-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1150px]">
                  <thead>
                    <tr className="border-b border-gold-200 bg-maroon-900">
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gold-200">Complaint</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gold-200">Crime</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gold-200">Incident</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gold-200">Priority</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gold-200">Status</th>
                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-gold-200">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-100">
                    {filteredComplaints.map((complaint) => (
                      <tr key={complaint.complaint_id} className="transition-colors hover:bg-maroon-50/40">
                        <td className="px-5 py-4">
                          <div className="max-w-[280px]">
                            <p className="font-medium text-ink-900">{complaint.complaint_number}</p>
                            <p className="mt-1 truncate text-xs text-ink-500">
                              {complaint.description || "No description available"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-ink-900">{complaint.crime_category || "—"}</p>
                          <p className="mt-1 text-xs text-ink-600">{complaint.crime_subcategory || "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            {complaint.incident_date ? (
                              <div className="flex items-center gap-2 text-sm text-ink-800">
                                <CalendarDays size={14} className="shrink-0 text-maroon-800" />
                                <span>{formatDate(complaint.incident_date)}</span>
                              </div>
                            ) : (
                              <div className="text-sm text-ink-500">Date not available</div>
                            )}
                            {complaint.location ? (
                              <div className="flex max-w-[230px] items-center gap-1.5">
                                <MapPin size={13} className="shrink-0 text-maroon-800" />
                                <span className="truncate text-xs text-ink-500">{complaint.location}</span>
                              </div>
                            ) : (
                              <div className="text-xs text-ink-500">Location not available</div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <PriorityBadge priority={complaint.priority} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={complaint.status} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {isUnassigned(complaint.status) && (
                              <Link
                                href={`/assign-case?complaint_id=${encodeURIComponent(complaint.complaint_id)}`}
                                className="inline-flex items-center gap-1.5 rounded-md bg-gold-600 px-3 py-2 text-xs font-semibold text-maroon-900 transition hover:bg-gold-500"
                              >
                                <UserPlus size={14} />
                                Assign Case
                              </Link>
                            )}
                            <Link
                              href={`/complaints/${encodeURIComponent(complaint.complaint_id)}`}
                              className="inline-flex items-center gap-1.5 rounded-md border border-gold-300 bg-white px-3 py-2 text-xs font-semibold text-maroon-800 transition hover:border-maroon-700 hover:bg-maroon-800 hover:text-gold-100"
                            >
                              <Eye size={14} />
                              View Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  </DashboardLayout>
);
}

// ============================================================
// CHECK WHETHER CASE CAN BE ASSIGNED
// ============================================================

function isUnassigned(status?: string | null) {
  const value = normalizeStatus(status);

  return (
    value === "registered" ||
    value === "pending" ||
    value === "unassigned"
  );
}

// ============================================================
// NORMALIZE
// ============================================================

function normalizeStatus(
  value?: string | null
) {
  return (
    value
      ?.trim()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\s+/g, " ") || ""
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ============================================================
// PRIORITY BADGE
// ============================================================

function PriorityBadge({
  priority,
}: {
  priority?: string | null;
}) {
  const value = normalizeStatus(priority);

  let classes =
    "border-gold-200 bg-gold-50 text-ink-700";

  if (value === "high") {
    classes =
      "border-red-200 bg-red-50 text-red-700";
  } else if (value === "medium") {
    classes =
      "border-amber-200 bg-amber-50 text-amber-700";
  } else if (value === "low") {
    classes =
      "border-green-200 bg-green-50 text-green-700";
  }

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {priority || "—"}
    </span>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const value = normalizeStatus(status);

  let classes =
    "border border-ink-200 bg-ink-50 text-ink-700";

  if (value === "draft") {
    classes =
      "border border-slate-300 bg-slate-100 text-slate-700";
  } else if (value === "registered") {
    classes =
      "border border-blue-200 bg-blue-50 text-blue-700";
  } else if (value === "assigned") {
    classes =
      "border border-purple-200 bg-purple-50 text-purple-700";
  } else if (
    value === "under investigation"
  ) {
    classes =
      "border border-amber-200 bg-amber-50 text-amber-700";
  } else if (value === "closed") {
    classes =
      "border border-green-200 bg-green-50 text-green-700";
  } else if (value === "rejected") {
    classes =
      "border border-red-200 bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {status || "—"}
    </span>
  );
}

// ============================================================
// STATUS LEGEND
// ============================================================

function StatusLegend({
  label,
  status,
}: {
  label: string;
  status: string;
}) {
  const value = normalizeStatus(status);

  let dot = "bg-slate-400";

  if (value === "registered") {
    dot = "bg-blue-500";
  } else if (value === "assigned") {
    dot = "bg-purple-500";
  } else if (value === "under investigation") {
    dot = "bg-amber-500";
  } else if (value === "closed") {
    dot = "bg-green-500";
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-ink-600">
      <span
        className={`h-2 w-2 rounded-full ${dot}`}
      />
      {label}
    </div>
  );
}