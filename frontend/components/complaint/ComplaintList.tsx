"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface ComplaintSummary {
  complaint_id: string;
  complainant_name?: string;
  phone?: string;
  email?: string;
  crime_type?: string;
  location?: string;
  description?: string;
  status?: string;
  created_at?: string;
  incident_datetime?: string;
}

export default function ComplaintList({ initialComplaints }: { initialComplaints?: ComplaintSummary[] }) {
  const [complaints, setComplaints] = useState<ComplaintSummary[]>(initialComplaints || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseComplaintIds, setCaseComplaintIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadData() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

        if (!initialComplaints) {
          const response = await axios.get(`${API_BASE}/api/complaints`);
          setComplaints(response.data.complaints || []);
        }

        // fetch cases to detect which complaints already have cases
        try {
          const casesRes = await axios.get(`${API_BASE}/api/cases`);
          const cases = casesRes.data.cases || [];
          const ids = new Set<string>();
          for (const c of cases) {
            if (c.complaint_id) ids.add(String(c.complaint_id));
          }
          setCaseComplaintIds(ids);
        } catch (e) {
          // non-fatal
          console.warn("Could not load cases to detect linked complaints", e);
        }
      } catch (err: any) {
        console.error("Failed to load complaints:", err);
        const msg = err?.response?.data?.detail || err?.message || String(err);
        setError(`Unable to load complaints: ${msg}`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="rounded-3xl border border-gold-200 bg-white p-6 shadow-sm">Loading complaints...</div>;
  }

  if (error) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">{error}</div>;
  }

  if (!complaints.length) {
    return (
      <div className="rounded-3xl border border-gold-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink-900">No complaints registered yet</h2>
        <p className="mt-2 text-ink-600">Submit a complaint from the registration page and it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {complaints.map((complaint) => {
        const status = complaint.status || "Pending";
        const statusClasses =
          status.toLowerCase() === "closed"
            ? "bg-emerald-50 text-emerald-700"
            : status.toLowerCase() === "rejected"
            ? "bg-rose-50 text-rose-700"
            : "bg-gold-50 text-gold-700";

        const desc = complaint.description || "Not provided";

        const hasCase = caseComplaintIds.has(complaint.complaint_id);
        const caseMarker = hasCase ? "ring-2 ring-emerald-200" : "";

        return (
          <div key={complaint.complaint_id} className={`relative overflow-hidden rounded-2xl border border-gold-200 bg-white p-5 shadow-md hover:shadow-lg transition-shadow ${caseMarker}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-ink-900">{complaint.complaint_id}</h3>
                <p className="mt-1 text-sm text-ink-600">{complaint.complainant_name || "—"}</p>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}>{status}</span>
                <time className="text-xs text-ink-600">{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "No date"}</time>
              </div>
            </div>

            <div className="mt-3 text-sm text-ink-600">
              <p className="font-medium text-ink-900">Crime</p>
              <p className="mt-1">{complaint.crime_type || "Not provided"} • {complaint.location || "Location N/A"}</p>
            </div>

            <div className="mt-3 text-sm text-ink-600">
              <p className="font-medium text-ink-900">Description</p>
              <p className="mt-1 text-sm text-ink-600">{desc.length > 200 ? desc.slice(0, 200) + "..." : desc}</p>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Link href={`/complaints/${complaint.complaint_id}`} className="inline-flex items-center rounded-md bg-gold-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-gold-700">View details</Link>

              {hasCase && (
                <Link href="/cases" className="text-sm text-emerald-600 hover:underline">View case</Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}