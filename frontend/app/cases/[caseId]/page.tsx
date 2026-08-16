"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  FileText,
  Shield,
  User,
  Users,
  MapPin,
  Loader2,
  AlertCircle,
  Play,
  Calendar,
  Building2,
  Send,
  X,
  Download,
  Image as ImageIcon,
  FileAudio,
  File,
} from "lucide-react";

import IOSidebar from "../../../components/layout/io/Sidebar";
import DashboardLayout from "../../dashboard/layout";


/* ============================================================
   CASE
============================================================ */

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

  assigned_officer_id:
    | number
    | string
    | null;

  created_at: string | null;
  updated_at: string | null;
  closed_at: string | null;
}


/* ============================================================
   COMPLAINT
============================================================ */

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

  ai_summary?: string | null;

  officer_notes?: string | null;

  status: string;

  created_at?: string | null;

  updated_at?: string | null;
}


/* ============================================================
   COMPLAINANT
============================================================ */

interface Complainant {
  complainant_id: string;

  name: string;

  contact?: string | null;

  relationship?: string | null;

  statement?: string | null;

  type?: string | null;

  address?: string | null;
}


/* ============================================================
   VICTIM
============================================================ */

interface Victim {
  victim_id: string;

  name: string;

  contact?: string | null;

  relationship?: string | null;

  statement?: string | null;

  type?: string | null;

  description?: string | null;

  address?: string | null;

  photo_url?: string | null;
}


/* ============================================================
   SUSPECT
============================================================ */

interface Suspect {
  suspect_id: string;

  name?: string | null;

  contact?: string | null;

  description?: string | null;

  status?: string | null;

  type?: string | null;

  address?: string | null;

  photo_url?: string | null;
}


/* ============================================================
   EVIDENCE
============================================================ */

interface Evidence {
  evidence_id: string;

  evidence_type?: string | null;

  file_name?: string | null;

  file_type?: string | null;

  cloudinary_url?: string | null;

  cloudinary_public_id?: string | null;

  extracted_text?: string | null;

  summary?: string | null;

  extraction_data?: unknown;

  created_at?: string | null;
}


/* ============================================================
   CASE VIEW RESPONSE
============================================================ */

interface CaseViewData {
  case: CaseDetails;

  complaint: Complaint | null;

  complainants: Complainant[];

  victims: Victim[];

  suspects: Suspect[];

  evidence: Evidence[];
}


/* ============================================================
   LEGAL RESPONSE DATA
============================================================ */

interface LegalResponseData {
  summary?: string;

  information_provided?: Record<
    string,
    unknown
  >;

  missing_information?: string[];

  issues?: string[];

  relevant_dates?: string[];

  relevant_identifiers?: string[];
}


/* ============================================================
   LEGAL REQUEST
============================================================ */

interface LegalRequest {
  request_id: string;

  case_id: string;

  complaint_id: string | null;

  agency_type: string;

  agency_name: string;

  recipient_email: string;

  subject: string;

  status: string | null;

  document_url: string | null;

  sent_at: string | null;

  response_received_at: string | null;

  response_document_url: string | null;

  response_file_name: string | null;

  response_file_type: string | null;

  response_summary: string | null;

  response_data:
    | LegalResponseData
    | null;
}


/* ============================================================
   SEND REQUEST FORM
============================================================ */

interface LegalRequestForm {
  agency_type: string;

  agency_name: string;

  recipient_email: string;

  subject: string;

  message: string;
}


/* ============================================================
   STATUS STYLE
============================================================ */

function getStatusStyle(
  status: string | null
) {
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

    case "responded":
      return "border-green-200 bg-green-50 text-green-700";

    case "sent":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "closed":
      return "border-gray-200 bg-gray-100 text-gray-700";

    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}


/* ============================================================
   PRIORITY STYLE
============================================================ */

function getPriorityStyle(
  priority: string | null
) {
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
   DATE
============================================================ */

function formatDate(
  value: string | null | undefined
) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "-";
  }
}


/* ============================================================
   DATETIME
============================================================ */

function formatDateTime(
  value: string | null | undefined
) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
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
  value:
    | string
    | number
    | null
    | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-ink-900">
        {value !== null &&
        value !== undefined &&
        value !== ""
          ? String(value)
          : "-"}
      </p>
    </div>
  );
}


/* ============================================================
   SECTION
============================================================ */

function Section({
  label,
  title,
  icon,
  children,
}: {
  label: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gold-200 bg-white p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-gold-100 pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
          {icon}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-700">
            {label}
          </p>

          <h2 className="font-serif text-lg text-ink-900">
            {title}
          </h2>
        </div>
      </div>

      {children}
    </section>
  );
}


/* ============================================================
   EMPTY
============================================================ */

function EmptySection({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-gold-200 bg-ivory/40 p-8 text-center">
      <p className="text-sm text-ink-500">
        {text}
      </p>
    </div>
  );
}


/* ============================================================
   PERSON CARD
============================================================ */

function PersonCard({
  name,
  contact,
  relationship,
  type,
  address,
  statement,
  description,
  status,
  photoUrl,
}: {
  name: string;

  contact?: string | null;

  relationship?: string | null;

  type?: string | null;

  address?: string | null;

  statement?: string | null;

  description?: string | null;

  status?: string | null;

  photoUrl?: string | null;
}) {
  return (
    <div className="rounded-lg border border-gold-200 bg-ivory/40 p-5">

      <div className="flex gap-4">

        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-16 w-16 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
            <User size={24} />
          </div>
        )}

        <div className="min-w-0">

          <h3 className="font-serif text-lg text-ink-900">
            {name}
          </h3>

          {type && (
            <p className="mt-0.5 text-xs text-ink-500">
              {type}
            </p>
          )}

        </div>

      </div>


      <div className="mt-5 grid gap-4 sm:grid-cols-2">

        <InfoItem
          label="Contact"
          value={contact}
        />

        <InfoItem
          label="Relationship"
          value={relationship}
        />

        <InfoItem
          label="Status"
          value={status}
        />

        <InfoItem
          label="Address"
          value={address}
        />

      </div>


      {description && (
        <div className="mt-5 border-t border-gold-100 pt-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            Description
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">
            {description}
          </p>

        </div>
      )}


      {statement && (
        <div className="mt-5 border-t border-gold-100 pt-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            Statement
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-700">
            {statement}
          </p>

        </div>
      )}

    </div>
  );
}


/* ============================================================
   EVIDENCE CARD
============================================================ */

function EvidenceCard({
  evidence,
}: {
  evidence: Evidence;
}) {
  const fileType =
    evidence.file_type?.toLowerCase() ||
    "";

  let Icon = File;

  if (
    fileType.includes("image") ||
    fileType.includes("jpg") ||
    fileType.includes("png") ||
    fileType.includes("jpeg")
  ) {
    Icon = ImageIcon;
  } else if (
    fileType.includes("audio") ||
    fileType.includes("mp3") ||
    fileType.includes("wav")
  ) {
    Icon = FileAudio;
  } else if (
    fileType.includes("pdf") ||
    fileType.includes("document")
  ) {
    Icon = FileText;
  }

  return (
    <div className="rounded-lg border border-gold-200 bg-ivory/40 p-5">

      <div className="flex items-start justify-between gap-4">

        <div className="flex min-w-0 gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-maroon-50 text-maroon-800">
            <Icon size={19} />
          </div>

          <div className="min-w-0">

            <h3 className="truncate text-sm font-semibold text-ink-900">
              {evidence.file_name ||
                "Unnamed evidence"}
            </h3>

            <p className="mt-1 text-xs text-ink-500">
              {evidence.evidence_type ||
                "Evidence"}

              {evidence.file_type
                ? ` · ${evidence.file_type}`
                : ""}
            </p>

          </div>

        </div>


        {evidence.cloudinary_url && (
          <a
            href={evidence.cloudinary_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gold-300 bg-white px-3 py-2 text-xs font-medium text-maroon-800 hover:bg-maroon-800 hover:text-gold-100"
          >
            <Download size={14} />
            Open
          </a>
        )}

      </div>


      {evidence.summary && (
        <div className="mt-4 border-t border-gold-100 pt-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            Summary
          </p>

          <p className="mt-1 text-sm leading-6 text-ink-700">
            {evidence.summary}
          </p>

        </div>
      )}


      {evidence.extracted_text && (
        <div className="mt-4 border-t border-gold-100 pt-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
            Extracted Text
          </p>

          <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-ink-700">
            {evidence.extracted_text}
          </p>

        </div>
      )}

    </div>
  );
}


/* ============================================================
   TIMELINE
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


/* ============================================================
   PAGE
============================================================ */

export default function CaseDetailsPage() {

  const params = useParams();

  const router = useRouter();

  const caseId =
    params.caseId as string;


  /* ==========================================================
     CASE STATE
  ========================================================== */

  const [caseData, setCaseData] =
    useState<CaseViewData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* ==========================================================
     INVESTIGATION STATE
  ========================================================== */

  const [
    startingInvestigation,
    setStartingInvestigation,
  ] = useState(false);

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");


  /* ==========================================================
     LEGAL REQUESTS
  ========================================================== */

  const [
    legalRequests,
    setLegalRequests,
  ] = useState<LegalRequest[]>([]);

  const [
    legalRequestsLoading,
    setLegalRequestsLoading,
  ] = useState(true);

  const [
    legalRequestsError,
    setLegalRequestsError,
  ] = useState("");


  /* ==========================================================
     SEND REQUEST MODAL
  ========================================================== */

  const [
    showRequestModal,
    setShowRequestModal,
  ] = useState(false);

  const [
    sendingRequest,
    setSendingRequest,
  ] = useState(false);

  const [
    requestForm,
    setRequestForm,
  ] = useState<LegalRequestForm>({
    agency_type: "",
    agency_name: "",
    recipient_email: "",
    subject: "",
    message: "",
  });


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
          process.env
            .BACKEND_API_URL ||
          "http://localhost:8000";

        const response =
          await fetch(
            `${API_BASE}/api/cases/${encodeURIComponent(
              caseId
            )}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

        const data =
          await response.json();

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
     LOAD LEGAL REQUESTS
  ========================================================== */

  async function loadLegalRequests() {

    if (!caseId) return;

    try {

      setLegalRequestsLoading(true);

      setLegalRequestsError("");

      const API_BASE =
        process.env
          .BACKEND_API_URL ||
        "http://localhost:8000";

      const response =
        await fetch(
          `${API_BASE}/api/legal-requests/case/${encodeURIComponent(
            caseId
          )}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            "Failed to load operator requests."
        );

      }

      setLegalRequests(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Legal requests error:",
        error
      );

      setLegalRequestsError(
        error instanceof Error
          ? error.message
          : "Failed to load operator requests."
      );

    } finally {

      setLegalRequestsLoading(false);

    }

  }


  useEffect(() => {

    loadLegalRequests();

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
        process.env
          .BACKEND_API_URL ||
        "http://localhost:8000";

      const response =
        await fetch(
          `${API_BASE}/api/cases/${encodeURIComponent(
            caseData.case.case_id
          )}/start-investigation`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            "Failed to start investigation."
        );

      }

      setCaseData(
        previous => {

          if (!previous)
            return previous;

          return {
            ...previous,

            case: {
              ...previous.case,

              status:
                data.status ??
                "Under Investigation",

              current_stage:
                data.current_stage ??
                "Investigation Started",

              updated_at:
                data.updated_at ??
                previous.case.updated_at,
            },
          };

        }
      );

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
     SEND LEGAL REQUEST
  ========================================================== */

  async function handleSendRequest() {

    if (!caseData) return;

    if (
      !requestForm.agency_type ||
      !requestForm.agency_name ||
      !requestForm.recipient_email ||
      !requestForm.subject ||
      !requestForm.message
    ) {

      setActionError(
        "Please fill all legal request fields."
      );

      return;

    }

    try {

      setSendingRequest(true);

      setActionError("");

      setActionMessage("");

      const API_BASE =
        process.env
          .BACKEND_API_URL ||
        "http://localhost:8000";

      const response =
        await fetch(
          `${API_BASE}/api/legal-requests`,
          {
            method: "POST",

            credentials: "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({

              case_id:
                caseData.case.case_id,

              complaint_id:
                caseData.case.complaint_id,

              agency_type:
                requestForm.agency_type,

              agency_name:
                requestForm.agency_name,

              recipient_email:
                requestForm.recipient_email,

              subject:
                requestForm.subject,

              message:
                requestForm.message,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            "Failed to send legal request."
        );

      }

      setShowRequestModal(false);

      setRequestForm({
        agency_type: "",
        agency_name: "",
        recipient_email: "",
        subject: "",
        message: "",
      });

      setActionMessage(
        data?.message ||
          "Legal request sent successfully."
      );

      await loadLegalRequests();

    } catch (error) {

      console.error(
        "Send legal request error:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to send legal request."
      );

    } finally {

      setSendingRequest(false);

    }

  }


  /* ==========================================================
     INVESTIGATION STARTED
  ========================================================== */

  const investigationStarted =
    caseData?.case.status
      ?.toLowerCase() ===
      "under investigation" ||
    caseData?.case.status
      ?.toLowerCase() ===
      "investigation";


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {

    return (
      <DashboardLayout>

        <div className="flex min-h-[calc(100vh-73px)]">

          <IOSidebar />

          <main className="flex-1 p-8">

            <div className="rounded-lg border border-gold-200 bg-white p-12 text-center">

              <Loader2 className="mx-auto h-7 w-7 animate-spin text-maroon-700" />

              <p className="mt-3 text-sm text-ink-600">
                Loading case details...
              </p>

            </div>

          </main>

        </div>

      </DashboardLayout>
    );

  }


  /* ==========================================================
     ERROR
  ========================================================== */

  if (error || !caseData) {

    return (
      <DashboardLayout>

        <div className="flex min-h-[calc(100vh-73px)]">

          <IOSidebar />

          <main className="flex-1 p-8">

            <button
              type="button"
              onClick={() =>
                router.push("/cases")
              }
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-maroon-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Cases
            </button>

            <div className="rounded-lg border border-red-200 bg-red-50 p-6">

              <div className="flex gap-3">

                <AlertCircle className="h-5 w-5 text-red-600" />

                <div>

                  <h2 className="font-semibold text-red-800">
                    Unable to load case
                  </h2>

                  <p className="mt-1 text-sm text-red-700">
                    {error ||
                      "Case not found."}
                  </p>

                </div>

              </div>

            </div>

          </main>

        </div>

      </DashboardLayout>
    );

  }


  const currentCase =
    caseData.case;

  const complaint =
    caseData.complaint;


  /* ============================================================
     RETURN
  ============================================================ */

  return (

    <DashboardLayout>

      <div className="flex min-h-[calc(100vh-73px)]">

        {/* SIDEBAR */}

        <IOSidebar />


        {/* MAIN */}

        <div className="flex min-w-0 flex-1 flex-col">

          <main className="flex-1 overflow-y-auto">

            <div className="mx-auto w-full max-w-7xl space-y-6 p-8">


              {/* =================================================
                  BACK
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  router.push("/cases")
                }
                className="inline-flex items-center gap-2 text-sm font-medium text-maroon-700 hover:text-maroon-900"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to My Cases
              </button>


              {/* =================================================
                  HEADER
              ================================================= */}

              <section className="rounded-lg border border-gold-200 bg-white p-6">

                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="font-semibold text-maroon-700">

                        {currentCase.case_number ||
                          currentCase.case_id}

                      </span>

                      {currentCase.status && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                            currentCase.status
                          )}`}
                        >
                          {currentCase.status}
                        </span>
                      )}

                      {currentCase.priority && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getPriorityStyle(
                            currentCase.priority
                          )}`}
                        >
                          {currentCase.priority} Priority
                        </span>
                      )}

                    </div>


                    <h1 className="mt-3 font-display text-2xl text-ink-900">

                      {currentCase.title ||
                        "Untitled Case"}

                    </h1>


                    <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">

                      {currentCase.description ||
                        "No case description available."}

                    </p>

                  </div>


                  {/* ACTIONS */}

                  <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">

                    {investigationStarted ? (

                      <div className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 bg-green-50 px-5 py-2.5 text-sm font-medium text-green-700">

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
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-maroon-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-60"
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


                    <button
                      type="button"
                      onClick={() => {
                        setActionError("");
                        setShowRequestModal(true);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-maroon-700 bg-white px-5 py-2.5 text-sm font-medium text-maroon-700 hover:bg-maroon-50"
                    >

                      <Send className="h-4 w-4" />

                      Send Request to Operator

                    </button>

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

              {actionError && !showRequestModal && (

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
                  CASE DETAILS
              ================================================= */}

              <Section
                label="Case"
                title="Case Details"
                icon={
                  <Shield size={18} />
                }
              >

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                  <InfoItem
                    label="Case ID"
                    value={
                      currentCase.case_id
                    }
                  />

                  <InfoItem
                    label="Case Number"
                    value={
                      currentCase.case_number
                    }
                  />

                  <InfoItem
                    label="Complaint ID"
                    value={
                      currentCase.complaint_id
                    }
                  />

                  <InfoItem
                    label="Status"
                    value={
                      currentCase.status
                    }
                  />

                  <InfoItem
                    label="Priority"
                    value={
                      currentCase.priority
                    }
                  />

                  <InfoItem
                    label="Current Stage"
                    value={
                      currentCase.current_stage
                    }
                  />

                  <InfoItem
                    label="Assigned IO"
                    value={
                      currentCase.assigned_officer_id
                        ? `Officer #${currentCase.assigned_officer_id}`
                        : null
                    }
                  />

                  <InfoItem
                    label="Created"
                    value={
                      formatDateTime(
                        currentCase.created_at
                      )
                    }
                  />

                  <InfoItem
                    label="Last Updated"
                    value={
                      formatDateTime(
                        currentCase.updated_at
                      )
                    }
                  />

                </div>

              </Section>


              {/* =================================================
                  INCIDENT
              ================================================= */}

              <Section
                label="Case"
                title="Incident Information"
                icon={
                  <MapPin size={18} />
                }
              >

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                  <InfoItem
  label="District"
  value="Surat"
/>

<InfoItem
  label="Police Station"
  value="Surat Police Station"
/>

<InfoItem
  label="Incident Date & Time"
  value={formatDateTime(currentCase.incident_datetime)}
/>

                </div>

              </Section>


              {/* =================================================
                  FIR
              ================================================= */}

              <Section
                label="Case"
                title="FIR Details"
                icon={
                  <FileText size={18} />
                }
              >

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                  <InfoItem
                    label="FIR Number"
                    value={
                      currentCase.fir_no
                    }
                  />

                  <InfoItem
                    label="FIR Year"
                    value={
                      currentCase.fir_year
                    }
                  />

                  <InfoItem
                    label="FIR Date"
                    value={
                      formatDate(
                        currentCase.fir_date
                      )
                    }
                  />

                </div>

              </Section>


             

              


              {/* =================================================
                  INVESTIGATION
              ================================================= */}

              <Section
                label="Case"
                title="Investigation"
                icon={
                  <User size={18} />
                }
              >

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
                              {currentCase.current_stage ||
                                "Investigation Started"}
                            </strong>
                          </span>

                          <span>
                            Updated:{" "}
                            <strong>
                              {formatDateTime(
                                currentCase.updated_at
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
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-maroon-700 px-4 py-2 text-sm font-medium text-white hover:bg-maroon-800 disabled:opacity-60"
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

              </Section>


              {/* =================================================
                  COMPLAINT DETAILS
              ================================================= */}

              {complaint && (

                <>

                  <Section
                    label="Complaint"
                    title="Complaint Details"
                    icon={
                      <FileText size={18} />
                    }
                  >

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

                      <InfoItem
                        label="Complaint Number"
                        value={
                          complaint.complaint_number
                        }
                      />

                      <InfoItem
                        label="Complaint Type"
                        value={
                          complaint.complaint_type
                        }
                      />

                      <InfoItem
                        label="Crime Category"
                        value={
                          complaint.crime_category
                        }
                      />

                      <InfoItem
                        label="Crime Subcategory"
                        value={
                          complaint.crime_subcategory
                        }
                      />

                      <InfoItem
                        label="Incident Date"
                        value={
                          complaint.incident_date
                            ? formatDate(
                                complaint.incident_date
                              )
                            : null
                        }
                      />

                      <InfoItem
                        label="Incident Time"
                        value={
                          complaint.incident_time
                        }
                      />

                      <InfoItem
                        label="Priority"
                        value={
                          complaint.priority
                        }
                      />

                      <InfoItem
                        label="Status"
                        value={
                          complaint.status
                        }
                      />

                    </div>


                    <div className="mt-6 border-t border-gold-100 pt-5">

                      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                        Incident Location
                      </p>

                      <div className="mt-2 flex items-start gap-2 text-sm text-ink-800">

                        <MapPin
                          size={17}
                          className="mt-0.5 shrink-0 text-maroon-800"
                        />

                        <span>
                          {complaint.location ||
                            "Location not provided"}
                        </span>

                      </div>

                    </div>


                    <div className="mt-6 border-t border-gold-100 pt-5">

                      <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                        Complaint Description
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-800">
                        {complaint.description ||
                          "No description provided."}
                      </p>

                    </div>


                    {complaint.ai_summary && (

                      <div className="mt-6 border-t border-gold-100 pt-5">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                          AI Summary
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-800">
                          {complaint.ai_summary}
                        </p>

                      </div>

                    )}


                    {complaint.officer_notes && (

                      <div className="mt-6 border-t border-gold-100 pt-5">

                        <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                          Officer Notes
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-800">
                          {complaint.officer_notes}
                        </p>

                      </div>

                    )}

                  </Section>


                  {/* =================================================
                      COMPLAINANTS
                  ================================================= */}

                  <Section
                    label="Complaint"
                    title="Complainant Details"
                    icon={
                      <User size={18} />
                    }
                  >

                    {caseData.complainants.length ===
                    0 ? (

                      <EmptySection
                        text="No complainant details available."
                      />

                    ) : (

                      <div className="space-y-5">

                        {caseData.complainants.map(
                          complainant => (

                            <PersonCard
                              key={
                                complainant.complainant_id
                              }
                              name={
                                complainant.name
                              }
                              contact={
                                complainant.contact
                              }
                              relationship={
                                complainant.relationship
                              }
                              type={
                                complainant.type
                              }
                              address={
                                complainant.address
                              }
                              statement={
                                complainant.statement
                              }
                            />

                          )
                        )}

                      </div>

                    )}

                  </Section>


                  {/* =================================================
                      VICTIMS
                  ================================================= */}

                  <Section
                    label="Complaint"
                    title="Victim Details"
                    icon={
                      <Users size={18} />
                    }
                  >

                    {caseData.victims.length ===
                    0 ? (

                      <EmptySection
                        text="No victim details available."
                      />

                    ) : (

                      <div className="grid gap-5 lg:grid-cols-2">

                        {caseData.victims.map(
                          victim => (

                            <PersonCard
                              key={
                                victim.victim_id
                              }
                              name={
                                victim.name
                              }
                              contact={
                                victim.contact
                              }
                              relationship={
                                victim.relationship
                              }
                              type={
                                victim.type
                              }
                              address={
                                victim.address
                              }
                              description={
                                victim.description
                              }
                              statement={
                                victim.statement
                              }
                              photoUrl={
                                victim.photo_url
                              }
                            />

                          )
                        )}

                      </div>

                    )}

                  </Section>


                  {/* =================================================
                      SUSPECTS
                  ================================================= */}

                  <Section
                    label="Complaint"
                    title="Suspect Details"
                    icon={
                      <Users size={18} />
                    }
                  >

                    {caseData.suspects.length ===
                    0 ? (

                      <EmptySection
                        text="No suspect details available."
                      />

                    ) : (

                      <div className="grid gap-5 lg:grid-cols-2">

                        {caseData.suspects.map(
                          suspect => (

                            <PersonCard
                              key={
                                suspect.suspect_id
                              }
                              name={
                                suspect.name ||
                                "Unknown suspect"
                              }
                              contact={
                                suspect.contact
                              }
                              type={
                                suspect.type
                              }
                              address={
                                suspect.address
                              }
                              description={
                                suspect.description
                              }
                              status={
                                suspect.status
                              }
                              photoUrl={
                                suspect.photo_url
                              }
                            />

                          )
                        )}

                      </div>

                    )}

                  </Section>


                  {/* =================================================
                      EVIDENCE
                  ================================================= */}

                  <Section
                    label="Complaint"
                    title="Complaint Evidence"
                    icon={
                      <FileText size={18} />
                    }
                  >

                    {caseData.evidence.length ===
                    0 ? (

                      <EmptySection
                        text="No evidence uploaded for this complaint."
                      />

                    ) : (

                      <div className="grid gap-4 lg:grid-cols-2">

                        {caseData.evidence.map(
                          item => (

                            <EvidenceCard
                              key={
                                item.evidence_id
                              }
                              evidence={item}
                            />

                          )
                        )}

                      </div>

                    )}

                  </Section>

                </>

              )}


              {/* =================================================
                  LEGAL REQUESTS
              ================================================= */}

              <section className="rounded-lg border border-gold-200 bg-white p-6">

                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div className="flex items-center gap-3">

                    <FileText className="h-5 w-5 text-maroon-700" />

                    <div>

                      <h2 className="font-medium text-ink-900">
                        Legal Requests & Operator Responses
                      </h2>

                      <p className="text-sm text-ink-600">
                        Send requests to external agencies and review their responses.
                      </p>

                    </div>

                  </div>


                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      setShowRequestModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-maroon-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-maroon-800"
                  >

                    <Send className="h-4 w-4" />

                    Send New Request

                  </button>

                </div>


                {/* LOADING */}

                {legalRequestsLoading && (

                  <div className="flex items-center gap-2 rounded-lg border border-gold-200 bg-ivory p-4">

                    <Loader2 className="h-4 w-4 animate-spin text-maroon-700" />

                    <p className="text-sm text-ink-600">
                      Loading requests...
                    </p>

                  </div>

                )}


                {/* ERROR */}

                {!legalRequestsLoading &&
                  legalRequestsError && (

                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">

                      <div className="flex items-start gap-3">

                        <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

                        <div>

                          <p className="font-medium text-red-800">
                            Unable to load requests
                          </p>

                          <p className="mt-1 text-sm text-red-700">
                            {legalRequestsError}
                          </p>

                        </div>

                      </div>

                    </div>

                  )}


                {/* EMPTY */}

                {!legalRequestsLoading &&
                  !legalRequestsError &&
                  legalRequests.length === 0 && (

                    <div className="rounded-lg border border-gold-200 bg-ivory p-5">

                      <p className="text-sm text-ink-600">
                        No legal information requests have been created for this case.
                      </p>

                    </div>

                  )}


                {/* REQUEST LIST */}

                {!legalRequestsLoading &&
                  !legalRequestsError &&
                  legalRequests.length > 0 && (

                    <div className="space-y-5">

                      {legalRequests.map(
                        request => {

                          const responseData =
                            request.response_data;

                          const hasResponse =
                            request.status
                              ?.toLowerCase() ===
                              "responded" ||
                            !!request.response_received_at;

                          return (

                            <div
                              key={
                                request.request_id
                              }
                              className="rounded-lg border border-gold-200 p-5"
                            >

                              {/* REQUEST HEADER */}

                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                                <div>

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h3 className="font-medium text-ink-900">
                                      {
                                        request.agency_name
                                      }
                                    </h3>

                                    <span
                                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                        hasResponse
                                          ? "border-green-200 bg-green-50 text-green-700"
                                          : getStatusStyle(
                                              request.status
                                            )
                                      }`}
                                    >

                                      {hasResponse
                                        ? "RESPONDED"
                                        : request.status ||
                                          "PENDING"}

                                    </span>

                                  </div>


                                  <p className="mt-1 text-sm text-ink-600">
                                    {
                                      request.subject
                                    }
                                  </p>


                                  <p className="mt-1 text-xs text-ink-500">

                                    {
                                      request.agency_type
                                    }

                                    {" · "}

                                    {
                                      request.recipient_email
                                    }

                                  </p>

                                </div>


                                <div className="text-xs text-ink-500">

                                  Request ID:{" "}

                                  <span className="font-medium text-ink-700">
                                    {
                                      request.request_id
                                    }
                                  </span>

                                </div>

                              </div>


                              {/* REQUEST SENT */}

                              <div className="mt-4 grid gap-4 sm:grid-cols-2">

                                <InfoItem
                                  label="Sent At"
                                  value={
                                    formatDateTime(
                                      request.sent_at
                                    )
                                  }
                                />

                                <InfoItem
                                  label="Response Received"
                                  value={
                                    formatDateTime(
                                      request.response_received_at
                                    )
                                  }
                                />

                              </div>


                              {/* RESPONSE */}

                              {hasResponse ? (

                                <div className="mt-5 space-y-5">

                                  {request.response_summary && (

                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">

                                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                        AI Analysis Summary
                                      </p>

                                      <p className="mt-2 text-sm leading-6 text-blue-900">
                                        {
                                          request.response_summary
                                        }
                                      </p>

                                    </div>

                                  )}


                                  {responseData?.issues &&
                                    responseData.issues.length >
                                      0 && (

                                      <div className="rounded-lg border border-red-200 bg-red-50 p-5">

                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                                          Issues
                                        </p>

                                        <ul className="mt-3 space-y-2">

                                          {responseData.issues.map(
                                            (
                                              issue,
                                              index
                                            ) => (

                                              <li
                                                key={
                                                  index
                                                }
                                                className="text-sm text-red-800"
                                              >
                                                •{" "}
                                                {
                                                  issue
                                                }
                                              </li>

                                            )
                                          )}

                                        </ul>

                                      </div>

                                    )}


                                  {responseData?.missing_information &&
                                    responseData
                                      .missing_information
                                      .length >
                                      0 && (

                                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">

                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                          Missing Information
                                        </p>

                                        <ul className="mt-3 space-y-2">

                                          {responseData.missing_information.map(
                                            (
                                              item,
                                              index
                                            ) => (

                                              <li
                                                key={
                                                  index
                                                }
                                                className="text-sm text-amber-800"
                                              >
                                                •{" "}
                                                {
                                                  item
                                                }
                                              </li>

                                            )
                                          )}

                                        </ul>

                                      </div>

                                    )}


                                  {responseData?.information_provided &&
                                    Object.keys(
                                      responseData.information_provided
                                    ).length >
                                      0 && (

                                      <div>

                                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
                                          Information Provided
                                        </p>

                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                                          {Object.entries(
                                            responseData.information_provided
                                          ).map(
                                            ([
                                              key,
                                              value,
                                            ]) => (

                                              <InfoItem
                                                key={
                                                  key
                                                }
                                                label={key.replace(
                                                  /_/g,
                                                  " "
                                                )}
                                                value={
                                                  typeof value ===
                                                  "object"
                                                    ? JSON.stringify(
                                                        value
                                                      )
                                                    : String(
                                                        value ??
                                                          "-"
                                                      )
                                                }
                                              />

                                            )
                                          )}

                                        </div>

                                      </div>

                                    )}



                                </div>

                              ) : (

                                <div className="mt-5 rounded-lg border border-gold-200 bg-ivory p-4">

                                  <p className="text-sm text-ink-600">
                                    No response has been received from this agency yet.
                                  </p>

                                </div>

                              )}

                            </div>

                          );

                        }
                      )}

                    </div>

                  )}

              </section>


              {/* =================================================
                  TIMELINE
              ================================================= */}

              <Section
                label="Case"
                title="Case Timeline"
                icon={
                  <Calendar size={18} />
                }
              >

                <div className="space-y-4">

                  <TimelineItem
                    title="Case Created"
                    date={
                      currentCase.created_at
                    }
                  />

                  {currentCase.updated_at && (

                    <TimelineItem
                      title="Last Updated"
                      date={
                        currentCase.updated_at
                      }
                    />

                  )}

                  {currentCase.closed_at && (

                    <TimelineItem
                      title="Case Closed"
                      date={
                        currentCase.closed_at
                      }
                    />

                  )}

                </div>

              </Section>


              {/* =================================================
                  RELATED MODULES
              ================================================= */}

              <div className="grid gap-5 md:grid-cols-2">

                


               

              </div>

            </div>

          </main>

        </div>

      </div>


      {/* ========================================================
          SEND REQUEST MODAL
      ======================================================== */}

      {showRequestModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-2xl rounded-xl border border-gold-200 bg-white shadow-xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gold-100 px-6 py-5">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-700">
                  Operator Communication
                </p>

                <h2 className="mt-1 font-serif text-xl text-ink-900">
                  Send Legal Request
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setShowRequestModal(false)
                }
                className="rounded-md p-2 text-ink-500 hover:bg-ivory hover:text-ink-900"
              >

                <X className="h-5 w-5" />

              </button>

            </div>


            {/* BODY */}

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6">

              {actionError && (

                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4">

                  <div className="flex items-start gap-2">

                    <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

                    <p className="text-sm text-red-700">
                      {actionError}
                    </p>

                  </div>

                </div>

              )}


              {/* CASE */}

              <div className="mb-5 rounded-lg border border-gold-200 bg-ivory p-4">

                <div className="grid gap-4 sm:grid-cols-2">

                  <InfoItem
                    label="Case Number"
                    value={
                      currentCase.case_number ||
                      currentCase.case_id
                    }
                  />

                  <InfoItem
                    label="Complaint Number"
                    value={
                      complaint?.complaint_number ||
                      "-"
                    }
                  />

                </div>

              </div>


              {/* FORM */}

              <div className="space-y-5">

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Agency Type
                    </label>

                    <select
                      value={
                        requestForm.agency_type
                      }
                      onChange={e =>
                        setRequestForm(
                          previous => ({
                            ...previous,
                            agency_type:
                              e.target.value,
                          })
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-500"
                    >

                      <option value="">
                        Select agency type
                      </option>

                      <option value="Telecom">
                        Telecom
                      </option>

                      <option value="Bank">
                        Bank
                      </option>

                      <option value="Government">
                        Government
                      </option>

                      <option value="Social Media">
                        Social Media
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>


                  <div>

                    <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                      Agency Name
                    </label>

                    <input
                      value={
                        requestForm.agency_name
                      }
                      onChange={e =>
                        setRequestForm(
                          previous => ({
                            ...previous,
                            agency_name:
                              e.target.value,
                          })
                        )
                      }
                      placeholder="e.g. Airtel"
                      className="mt-2 w-full rounded-lg border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-500"
                    />

                  </div>

                </div>


                <div>

                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Recipient Email
                  </label>

                  <input
                    type="email"
                    value={
                      requestForm.recipient_email
                    }
                    onChange={e =>
                      setRequestForm(
                        previous => ({
                          ...previous,
                          recipient_email:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="operator@example.com"
                    className="mt-2 w-full rounded-lg border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-500"
                  />

                </div>


                <div>

                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Subject
                  </label>

                  <input
                    value={
                      requestForm.subject
                    }
                    onChange={e =>
                      setRequestForm(
                        previous => ({
                          ...previous,
                          subject:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="Request for subscriber information"
                    className="mt-2 w-full rounded-lg border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-500"
                  />

                </div>


                <div>

                  <label className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Request Details
                  </label>

                  <textarea
                    rows={7}
                    value={
                      requestForm.message
                    }
                    onChange={e =>
                      setRequestForm(
                        previous => ({
                          ...previous,
                          message:
                            e.target.value,
                        })
                      )
                    }
                    placeholder="Describe the information or assistance required from the operator..."
                    className="mt-2 w-full resize-none rounded-lg border border-gold-200 bg-white px-3 py-3 text-sm leading-6 text-ink-900 outline-none focus:border-maroon-500"
                  />

                </div>

              </div>

            </div>


            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-gold-100 px-6 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowRequestModal(false)
                }
                disabled={
                  sendingRequest
                }
                className="rounded-lg border border-gold-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-700 hover:bg-ivory disabled:opacity-60"
              >
                Cancel
              </button>


              <button
                type="button"
                onClick={
                  handleSendRequest
                }
                disabled={
                  sendingRequest
                }
                className="inline-flex items-center gap-2 rounded-lg bg-maroon-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {sendingRequest ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Request
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </DashboardLayout>
  );
}