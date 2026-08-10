"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Shield,
  User,
  MapPin,
  Loader2,
  AlertCircle,
  Play,
  Calendar,
  Building2,
} from "lucide-react";

import IOSidebar from "../../../components/layout/io/Sidebar";
import DashboardLayout from "../../dashboard/layout";

interface CaseDetails {
  case_id: string;
  complaint_id: string | null;
  case_number: string | null;
  title: string | null;
  status: string | null;
  priority: string | null;
  description: string | null;

  district: string | null;
  police_station: string | null;
  incident_datetime: string | null;

  fir_no: string | null;
  fir_year: number | null;
  fir_date: string | null;

  original_chargesheet_no: string | null;
  original_chargesheet_date: string | null;

  supplementary_chargesheet_no: string | null;
  supplementary_reason: string | null;

  court_name: string | null;
  court_no: string | null;

  current_stage: string | null;

  assigned_officer_id: number | string | null;

  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
}

/* ============================================================
   STATUS STYLE
============================================================ */

function getStatusStyle(status: string | null) {
  switch (status?.toLowerCase()) {
    case "open":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "assigned":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "investigation":
    case "under investigation":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "legally cleared":
      return "border-green-200 bg-green-50 text-green-700";

    case "closed":
      return "border-gray-200 bg-gray-100 text-gray-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

/* ============================================================
   PRIORITY STYLE
============================================================ */

function getPriorityStyle(priority: string | null) {
  switch (priority?.toLowerCase()) {
    case "high":
      return "border-red-200 bg-red-50 text-red-700";

    case "medium":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "low":
      return "border-green-200 bg-green-50 text-green-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

/* ============================================================
   FORMAT DATE
============================================================ */

function formatDate(value: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/* ============================================================
   FORMAT DATETIME
============================================================ */

function formatDateTime(value: string | null) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-ink-900">
        {value || "-"}
      </p>
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function CaseDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const caseId = params.caseId as string;

  const [caseData, setCaseData] =
    useState<CaseDetails | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [startingInvestigation, setStartingInvestigation] =
    useState(false);

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  /* ==========================================================
     LOAD CASE
  ========================================================== */

  useEffect(() => {
    if (!caseId) return;

    async function loadCase() {
      try {
        setLoading(true);
        setError("");

        const API_BASE =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:8000";

        const response = await fetch(
          `${API_BASE}/api/cases/${encodeURIComponent(
            caseId
          )}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Failed to load case details."
          );
        }

        setCaseData(data);
      } catch (error) {
        console.error(
          "Case details error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load case details."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCase();
  }, [caseId]);

  /* ==========================================================
     START INVESTIGATION
  ========================================================== */

  async function handleStartInvestigation() {
    if (!caseData) return;

    try {
      setStartingInvestigation(true);

      setActionMessage("");
      setActionError("");

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";

      const response = await fetch(
        `${API_BASE}/api/cases/${encodeURIComponent(
          caseData.case_id
        )}/start-investigation`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to start investigation."
        );
      }

      /* -------------------------------------------------------
         Update page immediately
      ------------------------------------------------------- */

      setCaseData((previous) => {
        if (!previous) return previous;

        return {
          ...previous,

          status:
            data.status ??
            "Under Investigation",

          current_stage:
            data.current_stage ??
            "Investigation Started",

          updated_at:
            data.updated_at ??
            previous.updated_at,
        };
      });

      setActionMessage(
        data?.message ||
          "Investigation started successfully."
      );
    } catch (error) {
      console.error(
        "Start investigation error:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to start investigation."
      );
    } finally {
      setStartingInvestigation(false);
    }
  }

  /* ==========================================================
     INVESTIGATION STARTED?
  ========================================================== */

  const investigationStarted =
    caseData?.status?.toLowerCase() ===
      "under investigation" ||
    caseData?.status?.toLowerCase() ===
      "investigation";

  /* ==========================================================
     RETURN
  ========================================================== */

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-73px)]">

        {/* ====================================================
            IO SIDEBAR
        ==================================================== */}

        <IOSidebar />

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

        <div className="flex min-w-0 flex-1 flex-col">

          <main className="flex-1 overflow-y-auto">

            <div className="mx-auto w-full max-w-7xl space-y-6 p-8">

              {/* =================================================
                  BACK BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={() => router.push("/cases")}
                className="inline-flex items-center gap-2 text-sm font-medium text-maroon-700 transition hover:text-maroon-900"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to My Cases
              </button>

              {/* =================================================
                  LOADING
              ================================================= */}

              {loading && (
                <div className="rounded-lg border border-gold-200 bg-white p-12 text-center">

                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-maroon-700" />

                  <p className="mt-3 text-sm text-ink-600">
                    Loading case details...
                  </p>

                </div>
              )}

              {/* =================================================
                  ERROR
              ================================================= */}

              {!loading && error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">

                  <div className="flex items-start gap-3">

                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                      <h2 className="font-semibold text-red-800">
                        Unable to load case
                      </h2>

                      <p className="mt-1 text-sm text-red-700">
                        {error}
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  CASE
              ================================================= */}

              {!loading &&
                !error &&
                caseData && (
                  <>
                    {/* =================================================
                        CASE HEADER
                    ================================================= */}

                    <section className="rounded-lg border border-gold-200 bg-white p-6">

                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0">

                          {/* CASE NUMBER + STATUS */}

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="font-semibold text-maroon-700">
                              {caseData.case_number ||
                                caseData.case_id}
                            </span>

                            {caseData.status && (
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                                  caseData.status
                                )}`}
                              >
                                {caseData.status}
                              </span>
                            )}

                            {caseData.priority && (
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium ${getPriorityStyle(
                                  caseData.priority
                                )}`}
                              >
                                {caseData.priority} Priority
                              </span>
                            )}

                          </div>

                          {/* TITLE */}

                          <h1 className="mt-3 font-display text-2xl text-ink-900">
                            {caseData.title ||
                              "Untitled Case"}
                          </h1>

                          {/* DESCRIPTION */}

                          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">
                            {caseData.description ||
                              "No case description available."}
                          </p>

                        </div>

                        {/* =================================================
                            START INVESTIGATION
                        ================================================= */}

                        <div className="shrink-0">

                          {investigationStarted ? (
                            <div className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-5 py-2.5 text-sm font-medium text-green-700">
                              <Shield className="h-4 w-4" />

                              Investigation Started
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={
                                handleStartInvestigation
                              }
                              disabled={
                                startingInvestigation
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-maroon-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {startingInvestigation ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />

                                  Starting...
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4" />

                                  Start Investigation
                                </>
                              )}
                            </button>
                          )}

                        </div>

                      </div>

                    </section>

                    {/* =================================================
                        ACTION SUCCESS
                    ================================================= */}

                    {actionMessage && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4">

                        <div className="flex items-center gap-2">

                          <Shield className="h-5 w-5 text-green-600" />

                          <p className="text-sm font-medium text-green-700">
                            {actionMessage}
                          </p>

                        </div>

                      </div>
                    )}

                    {/* =================================================
                        ACTION ERROR
                    ================================================= */}

                    {actionError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                        <div className="flex items-center gap-2">

                          <AlertCircle className="h-5 w-5 text-red-600" />

                          <p className="text-sm font-medium text-red-700">
                            {actionError}
                          </p>

                        </div>

                      </div>
                    )}

                    {/* =================================================
                        CASE OVERVIEW
                    ================================================= */}

                    <section className="rounded-lg border border-gold-200 bg-white p-6">

                      <div className="mb-5 flex items-center gap-3">

                        <Shield className="h-5 w-5 text-maroon-700" />

                        <div>
                          <h2 className="font-medium text-ink-900">
                            Case Overview
                          </h2>

                          <p className="text-sm text-ink-600">
                            Basic information about this case.
                          </p>
                        </div>

                      </div>

                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                        <InfoItem
                          label="Case ID"
                          value={
                            caseData.case_id
                          }
                        />

                        <InfoItem
                          label="Complaint ID"
                          value={
                            caseData.complaint_id
                          }
                        />

                        <InfoItem
                          label="Current Stage"
                          value={
                            caseData.current_stage
                          }
                        />

                        <InfoItem
                          label="Assigned IO"
                          value={
                            caseData.assigned_officer_id
                              ? `Officer #${caseData.assigned_officer_id}`
                              : "-"
                          }
                        />

                        <InfoItem
                          label="Created"
                          value={formatDateTime(
                            caseData.created_at
                          )}
                        />

                        <InfoItem
                          label="Last Updated"
                          value={formatDateTime(
                            caseData.updated_at
                          )}
                        />

                      </div>

                    </section>

                    {/* =================================================
                        INCIDENT INFORMATION
                    ================================================= */}

                    <section className="rounded-lg border border-gold-200 bg-white p-6">

                      <div className="mb-5 flex items-center gap-3">

                        <MapPin className="h-5 w-5 text-maroon-700" />

                        <div>
                          <h2 className="font-medium text-ink-900">
                            Incident Information
                          </h2>

                          <p className="text-sm text-ink-600">
                            Location and incident details.
                          </p>
                        </div>

                      </div>

                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                        <InfoItem
                          label="District"
                          value={
                            caseData.district
                          }
                        />

                        <InfoItem
                          label="Police Station"
                          value={
                            caseData.police_station
                          }
                        />

                        <InfoItem
                          label="Incident Date & Time"
                          value={formatDateTime(
                            caseData.incident_datetime
                          )}
                        />

                      </div>

                    </section>

                    {/* =================================================
                        FIR DETAILS
                    ================================================= */}

                    <section className="rounded-lg border border-gold-200 bg-white p-6">

                      <div className="mb-5 flex items-center gap-3">

                        <FileText className="h-5 w-5 text-maroon-700" />

                        <div>
                          <h2 className="font-medium text-ink-900">
                            FIR Details
                          </h2>

                          <p className="text-sm text-ink-600">
                            FIR information associated with this case.
                          </p>
                        </div>

                      </div>

                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                        <InfoItem
                          label="FIR Number"
                          value={
                            caseData.fir_no
                          }
                        />

                        <InfoItem
                          label="FIR Year"
                          value={
                            caseData.fir_year
                              ? String(
                                  caseData.fir_year
                                )
                              : null
                          }
                        />

                        <InfoItem
                          label="FIR Date"
                          value={formatDate(
                            caseData.fir_date
                          )}
                        />

                      </div>

                    </section>

                    {/* =================================================
                        COURT / CHARGESHEET
                    ================================================= */}

                    <section className="rounded-lg border border-gold-200 bg-white p-6">

                      <div className="mb-5 flex items-center gap-3">

                        <Building2 className="h-5 w-5 text-maroon-700" />

                        <div>
                          <h2 className="font-medium text-ink-900">
                            Court & Chargesheet
                          </h2>

                          <p className="text-sm text-ink-600">
                            Judicial and chargesheet information.
                          </p>
                        </div>

                      </div>

                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                        <InfoItem
                          label="Court Name"
                          value={
                            caseData.court_name
                          }
                        />

                        <InfoItem
                          label="Court Number"
                          value={
                            caseData.court_no
                          }
                        />

                        <InfoItem
                          label="Original Chargesheet No."
                          value={
                            caseData.original_chargesheet_no
                          }
                        />

                        <InfoItem
                          label="Original Chargesheet Date"
                          value={formatDate(
                            caseData.original_chargesheet_date
                          )}
                        />

                        <InfoItem
                          label="Supplementary Chargesheet No."
                          value={
                            caseData.supplementary_chargesheet_no
                          }
                        />

                        <InfoItem
                          label="Supplementary Reason"
                          value={
                            caseData.supplementary_reason
                          }
                        />

                      </div>

                    </section>

                    {/* =================================================
                        INVESTIGATION
                    ================================================= */}

                    <section className="rounded-lg border border-gold-200 bg-white p-6">

                      <div className="mb-5 flex items-center gap-3">

                        <User className="h-5 w-5 text-maroon-700" />

                        <div>
                          <h2 className="font-medium text-ink-900">
                            Investigation
                          </h2>

                          <p className="text-sm text-ink-600">
                            Investigation status and case progress.
                          </p>
                        </div>

                      </div>

                      {investigationStarted ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-5">

                          <div className="flex items-start gap-3">

                            <Shield className="mt-0.5 h-5 w-5 text-green-600" />

                            <div>

                              <p className="font-medium text-green-800">
                                Investigation is active
                              </p>

                              <p className="mt-1 text-sm text-green-700">
                                Investigation started successfully.
                              </p>

                              <div className="mt-3 flex flex-wrap gap-4 text-xs text-green-700">

                                <span>
                                  Stage:{" "}
                                  <strong>
                                    {caseData.current_stage ||
                                      "Investigation Started"}
                                  </strong>
                                </span>

                                <span>
                                  Updated:{" "}
                                  <strong>
                                    {formatDateTime(
                                      caseData.updated_at
                                    )}
                                  </strong>
                                </span>

                              </div>

                            </div>

                          </div>

                        </div>
                      ) : (
                        <div className="rounded-lg border border-gold-200 bg-ivory p-5">

                          <p className="text-sm text-ink-600">
                            Investigation has not been started yet.
                          </p>

                          <button
                            type="button"
                            onClick={
                              handleStartInvestigation
                            }
                            disabled={
                              startingInvestigation
                            }
                            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-maroon-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {startingInvestigation ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Start Investigation
                              </>
                            )}
                          </button>

                        </div>
                      )}

                    </section>

                    {/* =================================================
                        CASE TIMELINE / METADATA
                    ================================================= */}

                    <section className="rounded-lg border border-gold-200 bg-white p-6">

                      <div className="mb-5 flex items-center gap-3">

                        <Calendar className="h-5 w-5 text-maroon-700" />

                        <div>
                          <h2 className="font-medium text-ink-900">
                            Case Timeline
                          </h2>

                          <p className="text-sm text-ink-600">
                            Important dates associated with the case.
                          </p>
                        </div>

                      </div>

                      <div className="space-y-4">

                        <TimelineItem
                          title="Case Created"
                          date={caseData.created_at}
                        />

                        {caseData.updated_at && (
                          <TimelineItem
                            title="Last Updated"
                            date={caseData.updated_at}
                          />
                        )}

                        {caseData.closed_at && (
                          <TimelineItem
                            title="Case Closed"
                            date={caseData.closed_at}
                          />
                        )}

                      </div>

                    </section>

                    {/* =================================================
                        RELATED MODULES
                    ================================================= */}

                    <div className="grid gap-5 md:grid-cols-2">

                      <Link
                        href={`/fir?case_id=${encodeURIComponent(
                          caseData.case_id
                        )}`}
                        className="rounded-lg border border-gold-200 bg-white p-5 transition hover:border-maroon-300 hover:shadow-sm"
                      >

                        <div className="flex items-start gap-3">

                          <FileText className="mt-0.5 h-5 w-5 text-maroon-700" />

                          <div>
                            <h3 className="font-medium text-ink-900">
                              FIR & Legal Details
                            </h3>

                            <p className="mt-1 text-sm text-ink-600">
                              View FIR information and applicable legal sections.
                            </p>
                          </div>

                        </div>

                      </Link>

                      <Link
                        href={`/case-diary?case_id=${encodeURIComponent(
                          caseData.case_id
                        )}`}
                        className="rounded-lg border border-gold-200 bg-white p-5 transition hover:border-maroon-300 hover:shadow-sm"
                      >

                        <div className="flex items-start gap-3">

                          <FileText className="mt-0.5 h-5 w-5 text-maroon-700" />

                          <div>
                            <h3 className="font-medium text-ink-900">
                              Case Diary
                            </h3>

                            <p className="mt-1 text-sm text-ink-600">
                              Record and review investigation activities.
                            </p>
                          </div>

                        </div>

                      </Link>

                    </div>

                  </>
                )}

            </div>

          </main>

        </div>

      </div>
    </DashboardLayout>
  );
}


/* ============================================================
   TIMELINE ITEM
============================================================ */

function TimelineItem({
  title,
  date,
}: {
  title: string;
  date: string | null;
}) {
  return (
    <div className="flex items-start gap-4">

      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-maroon-700" />

      <div>
        <p className="text-sm font-medium text-ink-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-ink-500">
          {formatDateTime(date)}
        </p>
      </div>

    </div>
  );
}