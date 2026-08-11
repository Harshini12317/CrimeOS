"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserPlus,
  User,
  MapPin,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

interface Complaint {
  complaint_id: string;
  complaint_number: string;
  complaint_type?: string | null;
  crime_category?: string | null;
  crime_subcategory?: string | null;
  priority?: string | null;
  incident_date?: string | null;
  incident_time?: string | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
}

interface Officer {
  id: number | string;
  name: string;
  email?: string | null;
  role: string;
}

function AssignCaseContent() {
  const searchParams = useSearchParams();

  const complaintId = searchParams.get("complaint_id");

  const [complaint, setComplaint] = useState<Complaint | null>(null);

  const [officers, setOfficers] = useState<Officer[]>([]);

  const [selectedOfficer, setSelectedOfficer] = useState("");

  const [loadingComplaint, setLoadingComplaint] = useState(true);

  const [loadingOfficers, setLoadingOfficers] = useState(true);

  const [assigning, setAssigning] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ============================================================
  // API URL
  // ============================================================

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // ============================================================
  // FETCH COMPLAINT
  // ============================================================

  async function fetchComplaint() {
    if (!complaintId) {
      setError("No complaint was selected for assignment.");
      setLoadingComplaint(false);
      return;
    }

    try {
      setLoadingComplaint(true);
      setError("");

      const response = await fetch(
        `${apiUrl}/api/complaints/${encodeURIComponent(complaintId)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Complaint not found."
            : "Failed to load complaint."
        );
      }

      const data = await response.json();

      /*
       * Our complaint details API returns:
       *
       * {
       *   complaint: {...},
       *   complainants: [...],
       *   victims: [...],
       *   suspects: [...],
       *   evidence: [...]
       * }
       *
       * So we use data.complaint.
       */

      setComplaint(data.complaint);
    } catch (err) {
      console.error("Complaint loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load complaint."
      );
    } finally {
      setLoadingComplaint(false);
    }
  }

  // ============================================================
  // FETCH IO LIST
  // ============================================================

  async function fetchOfficers() {
    try {
      setLoadingOfficers(true);

      const response = await fetch(`${apiUrl}/api/complaints/io`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to load IO list (${response.status})`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid officer list received.");
      }

      setOfficers(data);
    } catch (err) {
      console.error("Officer loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Investigation Officers."
      );
    } finally {
      setLoadingOfficers(false);
    }
  }

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchComplaint();
    fetchOfficers();
  }, [complaintId]);

  // ============================================================
  // ASSIGN CASE
  // ============================================================

  async function handleAssignCase() {
    if (!complaintId) {
      setError("No complaint selected.");
      return;
    }

    if (!selectedOfficer) {
      setError("Please select an Investigation Officer.");
      return;
    }

    try {
      setAssigning(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${apiUrl}/api/complaints/${encodeURIComponent(
          complaintId
        )}/assign`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            officer_id: selectedOfficer,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to assign case."
        );
      }

      setSuccess(
        data?.message || "Case assigned successfully."
      );

      /*
       * Update local complaint status immediately.
       */
      setComplaint((previous) =>
        previous
          ? {
              ...previous,
              status: "Assigned",
            }
          : previous
      );
    } catch (err) {
      console.error("Case assignment error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to assign case."
      );
    } finally {
      setAssigning(false);
    }
  }

  // ============================================================
  // NO COMPLAINT ID
  // ============================================================

  if (!complaintId) {
    return (
      <div className="min-h-full bg-ivory">
        <div className="mx-auto max-w-[1100px] px-8 py-8">
          <Link
            href="/complaints"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-maroon-800 hover:text-maroon-600"
          >
            <ArrowLeft size={16} />
            Back to Complaints
          </Link>

          <div className="rounded-lg border border-red-200 bg-red-50 p-8">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="mt-0.5 text-red-700"
              />

              <div>
                <h2 className="font-serif text-xl text-red-900">
                  Complaint not selected
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  Please open this page using the Assign Case
                  button from the complaint listing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="min-h-full bg-ivory">
      <div className="mx-auto max-w-[1100px] px-8 py-8">
        {/* ================================================== */}
        {/* BACK */}
        {/* ================================================== */}

        <Link
          href="/complaints"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-maroon-800 transition hover:text-maroon-600"
        >
          <ArrowLeft size={16} />
          Back to Complaints
        </Link>

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-6 rounded-lg border border-gold-200 bg-white px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
              <UserPlus size={21} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-700">
                Case Management
              </p>

              <h1 className="mt-1 font-serif text-2xl text-ink-900">
                Assign Case
              </h1>

              <p className="mt-1 text-sm text-ink-600">
                Assign this complaint to an Investigation Officer.
              </p>
            </div>
          </div>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* SUCCESS */}
        {/* ================================================== */}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-green-700"
              />

              <div>
                <p className="text-sm font-medium text-green-900">
                  {success}
                </p>

                <Link
                  href="/complaints"
                  className="mt-2 inline-block text-sm font-medium text-maroon-800 underline underline-offset-2"
                >
                  Return to complaints
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ================================================== */}
        {/* COMPLAINT SUMMARY */}
        {/* ================================================== */}

        <section className="rounded-lg border border-gold-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-gold-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
              <AlertTriangle size={18} />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
                Complaint
              </p>

              <h2 className="font-serif text-lg text-ink-900">
                Complaint Summary
              </h2>
            </div>
          </div>

          {loadingComplaint ? (
            <LoadingBlock text="Loading complaint..." />
          ) : complaint ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem
                  label="Complaint Number"
                  value={complaint.complaint_number}
                />

                <InfoItem
                  label="Crime Category"
                  value={complaint.crime_category}
                />

                <InfoItem
                  label="Crime Subcategory"
                  value={complaint.crime_subcategory}
                />

                <InfoItem
                  label="Priority"
                  value={complaint.priority}
                />
              </div>

              <div className="mt-5 grid gap-5 border-t border-gold-100 pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                    Incident
                  </p>

                  <div className="mt-2 space-y-2">
                    {complaint.incident_date && (
                      <div className="flex items-center gap-2 text-sm text-ink-800">
                        <CalendarDays
                          size={15}
                          className="text-maroon-800"
                        />

                        {formatDate(complaint.incident_date)}

                        {complaint.incident_time
                          ? ` · ${complaint.incident_time}`
                          : ""}
                      </div>
                    )}

                    {complaint.location && (
                      <div className="flex items-start gap-2 text-sm text-ink-700">
                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-maroon-800"
                        />

                        <span>{complaint.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                    Current Status
                  </p>

                  <div className="mt-2">
                    <StatusBadge status={complaint.status} />
                  </div>
                </div>
              </div>

              {complaint.description && (
                <div className="mt-5 border-t border-gold-100 pt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-800">
                    {complaint.description}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-sm text-ink-500">
              Complaint could not be loaded.
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* SELECT IO */}
        {/* ================================================== */}

        <section className="mt-6 rounded-lg border border-gold-200 bg-white p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-gold-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
              <User size={18} />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
                Investigation Officer
              </p>

              <h2 className="font-serif text-lg text-ink-900">
                Select Investigation Officer
              </h2>
            </div>
          </div>

          {loadingOfficers ? (
            <LoadingBlock text="Loading Investigation Officers..." />
          ) : officers.length === 0 ? (
            <div className="rounded-md border border-dashed border-gold-300 bg-ivory/50 p-8 text-center">
              <User
                size={24}
                className="mx-auto text-ink-400"
              />

              <p className="mt-3 text-sm font-medium text-ink-800">
                No active Investigation Officers found.
              </p>

              <p className="mt-1 text-xs text-ink-500">
                Make sure active users with the IO role exist in
                the users table.
              </p>

              <button
                type="button"
                onClick={fetchOfficers}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-gold-300 bg-white px-4 py-2 text-sm font-medium text-maroon-800 hover:bg-maroon-50"
              >
                <RefreshCw size={14} />
                Refresh Officers
              </button>
            </div>
          ) : (
            <div>
              <label
                htmlFor="officer"
                className="block text-sm font-medium text-ink-900"
              >
                Investigation Officer
              </label>

              <p className="mt-1 text-xs text-ink-500">
                Select the officer responsible for investigating
                this case.
              </p>

              <div className="relative mt-3">
                <User
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
                />

                <select
                  id="officer"
                  value={selectedOfficer}
                  onChange={(event) =>
                    setSelectedOfficer(event.target.value)
                  }
                  disabled={assigning}
                  className="w-full appearance-none rounded-md border border-gold-200 bg-white py-3 pl-10 pr-10 text-sm text-ink-900 outline-none transition focus:border-maroon-700 focus:ring-1 focus:ring-maroon-700/20 disabled:cursor-not-allowed disabled:bg-ink-50"
                >
                  <option value="">
                    Select an Investigation Officer
                  </option>

                  {officers.map((officer) => (
                    <option
                      key={officer.id}
                      value={officer.id}
                    >
                      {officer.name}
                      {officer.email
                        ? ` — ${officer.email}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECTED OFFICER */}

              {selectedOfficer && (
                <SelectedOfficer
                  officer={officers.find(
                    (officer) =>
                      String(officer.id) ===
                      String(selectedOfficer)
                  )}
                />
              )}
            </div>
          )}
        </section>

        {/* ================================================== */}
        {/* ACTION */}
        {/* ================================================== */}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/complaints"
            className="inline-flex items-center justify-center rounded-md border border-gold-300 bg-white px-5 py-2.5 text-sm font-medium text-maroon-800 transition hover:bg-maroon-50"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleAssignCase}
            disabled={
              assigning ||
              loadingComplaint ||
              loadingOfficers ||
              !complaint ||
              !selectedOfficer ||
              Boolean(success)
            }
            className="inline-flex items-center justify-center gap-2 rounded-md bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-gold-100 transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assigning ? (
              <>
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Assign Case
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-ink-900">
        {value || "—"}
      </p>
    </div>
  );
}

// ============================================================
// SELECTED OFFICER
// ============================================================

function SelectedOfficer({
  officer,
}: {
  officer?: Officer;
}) {
  if (!officer) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-md border border-gold-200 bg-ivory/50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-50 text-maroon-800">
        <User size={18} />
      </div>

      <div>
        <p className="text-sm font-semibold text-ink-900">
          {officer.name}
        </p>

        <p className="text-xs text-ink-500">
          {officer.email || "Investigation Officer"}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// STATUS
// ============================================================

function StatusBadge({
  status,
}: {
  status?: string | null;
}) {
  const value = status?.trim().toLowerCase() || "";

  let classes =
    "border border-ink-200 bg-ink-50 text-ink-700";

  if (value === "registered") {
    classes =
      "border border-blue-200 bg-blue-50 text-blue-700";
  } else if (value === "assigned") {
    classes =
      "border border-purple-200 bg-purple-50 text-purple-700";
  } else if (value === "under investigation") {
    classes =
      "border border-amber-200 bg-amber-50 text-amber-700";
  } else if (value === "closed") {
    classes =
      "border border-green-200 bg-green-50 text-green-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {status || "—"}
    </span>
  );
}

// ============================================================
// LOADING
// ============================================================

function LoadingBlock({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-ivory/50 p-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gold-200 border-t-maroon-800" />

      <p className="text-sm text-ink-600">{text}</p>
    </div>
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
// PAGE WRAPPER
// ============================================================

export default function AssignCasePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-ivory">
          <div className="mx-auto max-w-[1100px] px-8 py-8">
            <div className="rounded-lg border border-gold-200 bg-white p-8 text-center">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gold-200 border-t-maroon-800" />

              <p className="mt-3 text-sm text-ink-600">
                Loading assignment page...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <AssignCaseContent />
    </Suspense>
  );
}