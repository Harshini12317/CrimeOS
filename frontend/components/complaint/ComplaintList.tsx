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

export default function ComplaintList({
  initialComplaints,
  limit,
}: {
  initialComplaints?: ComplaintSummary[];
  limit?: number;
}) {
  const [complaints, setComplaints] = useState<ComplaintSummary[]>(
    initialComplaints || []
  );

  const [loading, setLoading] = useState(!initialComplaints);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialComplaints) {
      setLoading(false);
      return;
    }

    async function loadComplaints() {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          "http://localhost:8000";

        const response = await axios.get(
          `${API_BASE}/api/complaints`
        );

        console.log("Complaints API response:", response.data);

        setComplaints(
          Array.isArray(response.data)
            ? response.data
            : []
        );
      } catch (err: any) {
        console.error("Failed to load complaints:", err);

        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load complaints.";

        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, [initialComplaints]);

  if (loading) {
    return (
      <div className="rounded-lg border border-gold-200 bg-white p-6">
        <p className="text-sm text-ink-600">
          Loading complaints...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <h3 className="font-semibold text-rose-800">
          Unable to load complaints
        </h3>

        <p className="mt-1 text-sm text-rose-700">
          {error}
        </p>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="rounded-lg border border-gold-200 bg-white p-6 text-center">
        <h2 className="font-semibold text-ink-900">
          No complaints registered yet
        </h2>

        <p className="mt-2 text-sm text-ink-600">
          Complaints registered at this station will appear here.
        </p>
      </div>
    );
  }

  // Only display the requested number of complaints.
  const visibleComplaints = limit
    ? complaints.slice(0, limit)
    : complaints;

  return (
    <div className="space-y-3">
      {visibleComplaints.map((complaint) => {
        const status = complaint.status || "Pending";

        const statusClasses =
          status.toLowerCase() === "closed"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : status.toLowerCase() === "rejected"
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : status.toLowerCase() === "assigned"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-gold-50 text-gold-700 border-gold-200";

        return (
          <div
            key={complaint.complaint_id}
            className="rounded-lg border border-gold-200 bg-white p-4 transition hover:shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-mono text-sm font-bold text-maroon-700">
                    {complaint.complaint_number ||
                      complaint.complaint_id}
                  </h3>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses}`}
                  >
                    {status}
                  </span>
                </div>

                <p className="mt-1 text-sm font-medium text-ink-900">
                  {complaint.crime_category ||
                    "Crime category not specified"}
                </p>

                {complaint.crime_subcategory && (
                  <p className="text-xs text-ink-600">
                    {complaint.crime_subcategory}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                  <span>
                    📍 {complaint.location || "Location not provided"}
                  </span>

                  {complaint.priority && (
                    <span>
                      Priority:{" "}
                      <strong>{complaint.priority}</strong>
                    </span>
                  )}

                  {complaint.created_at && (
                    <span>
                      Registered:{" "}
                      {new Date(
                        complaint.created_at
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Link
                  href={`/complaints/${complaint.complaint_id}`}
                  className="inline-flex items-center rounded-md bg-gold-600 px-3 py-2 text-xs font-semibold text-white hover:bg-gold-700"
                >
                  View Details
                </Link>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}