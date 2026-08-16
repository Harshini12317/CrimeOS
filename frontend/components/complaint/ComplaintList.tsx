"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface ComplaintSummary {
  complaint_id: string;
  complaint_number?: string;
  complaint_type?: string;
  crime_category?: string;
  crime_subcategory?: string;
  priority?: string;
  location?: string;
  description?: string;
  status?: string;
  created_at?: string;
  incident_date?: string;
  incident_time?: string;
}

interface ComplaintListProps {
  initialComplaints?: ComplaintSummary[];
  limit?: number;
}

export default function ComplaintList({
  initialComplaints,
  limit,
}: ComplaintListProps) {
  const [complaints, setComplaints] = useState<ComplaintSummary[]>(
    initialComplaints || []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [caseComplaintIds, setCaseComplaintIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    async function loadData() {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_BACKEND_API_URL ??
          "http://localhost:8000";

        // --------------------------------------------------
        // Fetch complaints
        // --------------------------------------------------

        if (!initialComplaints) {
          const response = await axios.get(
            `${API_BASE}/api/complaints`
          );

          const fetchedComplaints =
            response.data?.complaints ||
            response.data ||
            [];

          setComplaints(fetchedComplaints);
        }

        // --------------------------------------------------
        // Fetch cases
        // Used to determine whether complaint is assigned
        // --------------------------------------------------

        try {
          const casesResponse = await axios.get(
            `${API_BASE}/api/cases`
          );

          const cases =
            casesResponse.data?.cases ||
            casesResponse.data ||
            [];

          const ids = new Set<string>();

          for (const c of cases) {
            if (c.complaint_id) {
              ids.add(String(c.complaint_id));
            }
          }

          setCaseComplaintIds(ids);
        } catch (caseError) {
          console.warn(
            "Could not load cases to detect assigned complaints:",
            caseError
          );
        }
      } catch (err: any) {
        console.error("Failed to load complaints:", err);

        const message =
          err?.response?.data?.detail ||
          err?.message ||
          "Unknown error";

        setError(`Unable to load complaints: ${message}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [initialComplaints]);

  // --------------------------------------------------
  // Loading
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="rounded-xl border border-gold-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-ink-600">
          Loading complaints...
        </p>
      </div>
    );
  }

  // --------------------------------------------------
  // Error
  // --------------------------------------------------

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  // --------------------------------------------------
  // Sort newest first
  // --------------------------------------------------

  const sortedComplaints = [...complaints].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;

    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });

  // --------------------------------------------------
  // Apply limit
  //
  // Dashboard -> limit={5}
  // Complaint page -> no limit, shows everything
  // --------------------------------------------------

  const displayedComplaints = limit
    ? sortedComplaints.slice(0, limit)
    : sortedComplaints;

  // --------------------------------------------------
  // No complaints
  // --------------------------------------------------

  if (!displayedComplaints.length) {
    return (
      <div className="rounded-xl border border-gold-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-ink-900">
            No complaints registered yet
          </h2>

          <p className="mt-2 text-sm text-ink-600">
            Complaints registered at this station will appear here.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Complaint cards
  // --------------------------------------------------

  return (
    <div className="space-y-3">
      {displayedComplaints.map((complaint) => {
        const status = complaint.status || "Pending";

        const normalizedStatus = status.toLowerCase();

        const statusClasses =
          normalizedStatus === "closed"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : normalizedStatus === "rejected"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : normalizedStatus === "assigned"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-gold-50 text-gold-700 border-gold-200";

        const hasCase = caseComplaintIds.has(
          String(complaint.complaint_id)
        );

        return (
          <div
            key={complaint.complaint_id}
            className={`rounded-xl border bg-white p-4 transition hover:shadow-md ${
              hasCase
                ? "border-emerald-200"
                : "border-gold-200"
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Left */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/complaints/${complaint.complaint_id}`}
                    className="font-mono text-sm font-bold text-maroon-700 hover:text-maroon-900 hover:underline"
                  >
                    {complaint.complaint_number ||
                      complaint.complaint_id}
                  </Link>

                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${statusClasses}`}
                  >
                    {status}
                  </span>

                  {hasCase && (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Assigned to IO
                    </span>
                  )}

                  {!hasCase && (
                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      Unassigned
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <p className="text-sm font-semibold text-ink-900">
                    {complaint.crime_category ||
                      "Crime category not specified"}
                  </p>

                  {complaint.crime_subcategory && (
                    <p className="text-xs text-ink-600">
                      {complaint.crime_subcategory}
                    </p>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                  <span>
                    Location:{" "}
                    <span className="font-medium text-ink-900">
                      {complaint.location || "Not provided"}
                    </span>
                  </span>

                  {complaint.priority && (
                    <span>
                      Priority:{" "}
                      <span className="font-medium text-ink-900">
                        {complaint.priority}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right */}
              <div className="flex shrink-0 items-center justify-between gap-4 md:flex-col md:items-end">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Registered
                  </p>

                  <p className="mt-1 text-xs font-medium text-ink-700">
                    {complaint.created_at
                      ? new Date(
                          complaint.created_at
                        ).toLocaleString()
                      : "Date unavailable"}
                  </p>
                </div>

                <Link
                  href={`/complaints/${complaint.complaint_id}`}
                  className="inline-flex items-center rounded-md bg-maroon-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-maroon-700"
                >
                  View Details
                </Link>
              </div>
            </div>

            {complaint.description && (
              <div className="mt-3 border-t border-gold-100 pt-3">
                <p className="line-clamp-2 text-xs leading-relaxed text-ink-600">
                  {complaint.description}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Show message when dashboard is limited */}
      {limit && sortedComplaints.length > limit && (
        <div className="pt-2 text-center">
          <Link
            href="/complaints"
            className="text-xs font-semibold text-maroon-700 hover:text-maroon-900 hover:underline"
          >
            View all {sortedComplaints.length} complaints →
          </Link>
        </div>
      )}
    </div>
  );
}