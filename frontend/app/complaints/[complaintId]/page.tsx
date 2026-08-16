"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  User,
  Users,
  FileText,
  Image as ImageIcon,
  FileAudio,
  File,
  Download,
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
  ai_summary?: string | null;
  officer_notes?: string | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Complainant {
  complainant_id: string;
  name: string;
  contact?: string | null;
  relationship?: string | null;
  statement?: string | null;
  type?: string | null;
  address?: string | null;
}

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

interface ComplaintDetails {
  complaint: Complaint;
  complainants: Complainant[];
  victims: Victim[];
  suspects: Suspect[];
  evidence: Evidence[];
}

export default function ComplaintDetailsPage({
  params,
}: {
  params: Promise<{ complaintId: string }>;
}) {
  const [data, setData] =
    useState<ComplaintDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComplaint() {
      try {
        const { complaintId } = await params;

        const apiUrl =
          process.env.NEXT_PUBLIC_BACKEND_API_URL ||
          "http://localhost:8000";

        const response = await fetch(
          `${apiUrl}/api/complaints/${complaintId}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Complaint not found."
              : "Failed to load complaint."
          );
        }

        const result = await response.json();

        setData(result);
      } catch (err) {
        console.error(
          "Complaint details error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load complaint."
        );
      } finally {
        setLoading(false);
      }
    }

    loadComplaint();
  }, [params]);

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-full bg-ivory">
        <div className="mx-auto max-w-[1400px] px-8 py-8">
          <div className="rounded-lg border border-gold-200 bg-white p-16 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gold-200 border-t-maroon-800" />

            <p className="mt-4 text-sm text-ink-600">
              Loading complaint details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------

  if (error || !data) {
    return (
      <div className="min-h-full bg-ivory">
        <div className="mx-auto max-w-[1400px] px-8 py-8">

          <Link
            href="/complaints"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-maroon-800 hover:text-maroon-600"
          >
            <ArrowLeft size={16} />
            Back to Complaints
          </Link>

          <div className="rounded-lg border border-red-200 bg-red-50 p-8">
            <h2 className="font-serif text-xl text-red-900">
              Unable to load complaint
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error || "Complaint not found."}
            </p>
          </div>

        </div>
      </div>
    );
  }

  const complaint = data.complaint;
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
    <section className="mt-6 rounded-lg border border-gold-200 bg-white p-6">

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
function EvidenceCard({
  evidence,
}: {
  evidence: Evidence;
}) {
  const fileType =
    evidence.file_type?.toLowerCase() || "";

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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const value = status?.toLowerCase();

  let classes =
    "bg-ink-100 text-ink-700";

  if (value === "registered") {
    classes = "bg-blue-50 text-blue-700";
  } else if (value === "assigned") {
    classes = "bg-purple-50 text-purple-700";
  } else if (
    value === "under investigation"
  ) {
    classes = "bg-amber-50 text-amber-700";
  } else if (value === "closed") {
    classes = "bg-green-50 text-green-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {status}
    </span>
  );
}
function PriorityBadge({
  priority,
}: {
  priority: string;
}) {
  const value = priority?.toLowerCase();

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
      {priority}
    </span>
  );
}
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

  return (
    <div className="min-h-full bg-ivory">
      <div className="mx-auto max-w-[1400px] px-8 py-8">

        {/* ================================================= */}
        {/* BACK */}
        {/* ================================================= */}

        <Link
          href="/complaints"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-maroon-800 transition hover:text-maroon-600"
        >
          <ArrowLeft size={16} />
          Back to Complaints
        </Link>

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="rounded-lg border border-gold-200 bg-white px-6 py-5">

          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-700">
                Complaint Details
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-3">

                <h1 className="font-serif text-2xl text-ink-900">
                  {complaint.complaint_number}
                </h1>

                <StatusBadge
                  status={complaint.status}
                />

                <PriorityBadge
                  priority={complaint.priority}
                />

              </div>

              <p className="mt-1 text-sm text-ink-600">
                {complaint.crime_category}
                {" · "}
                {complaint.crime_subcategory}
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* COMPLAINT INFORMATION */}
        {/* ================================================= */}

        <Section
          label="Complaint Information"
          title="Basic complaint details"
          icon={<FileText size={18} />}
        >

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            <InfoItem
              label="Complaint Number"
              value={complaint.complaint_number}
            />

            <InfoItem
              label="Complaint Type"
              value={complaint.complaint_type}
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
                complaint.incident_time ||
                null
              }
            />

            <InfoItem
              label="Priority"
              value={complaint.priority}
            />

            <InfoItem
              label="Status"
              value={complaint.status}
            />

          </div>

          {/* LOCATION */}

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

          {/* DESCRIPTION */}

          <div className="mt-6 border-t border-gold-100 pt-5">

            <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
              Complaint Description
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-800">
              {complaint.description ||
                "No description provided."}
            </p>

          </div>

          {/* AI SUMMARY */}

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

        </Section>

        {/* ================================================= */}
        {/* COMPLAINANTS */}
        {/* ================================================= */}

        <Section
          label="Complainant"
          title="Complainant details"
          icon={<User size={18} />}
        >

          {data.complainants.length === 0 ? (
            <EmptySection text="No complainant details available." />
          ) : (
            <div className="space-y-5">

              {data.complainants.map(
                (complainant) => (
                  <PersonCard
                    key={
                      complainant.complainant_id
                    }
                    name={complainant.name}
                    contact={complainant.contact}
                    relationship={
                      complainant.relationship
                    }
                    type={complainant.type}
                    address={complainant.address}
                    statement={
                      complainant.statement
                    }
                  />
                )
              )}

            </div>
          )}

        </Section>

        {/* ================================================= */}
        {/* VICTIMS */}
        {/* ================================================= */}

        <Section
          label="Victims"
          title="Victim details"
          icon={<Users size={18} />}
        >

          {data.victims.length === 0 ? (
            <EmptySection text="No victim details available." />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">

              {data.victims.map((victim) => (
                <PersonCard
                  key={victim.victim_id}
                  name={victim.name}
                  contact={victim.contact}
                  relationship={
                    victim.relationship
                  }
                  type={victim.type}
                  address={victim.address}
                  description={
                    victim.description
                  }
                  statement={victim.statement}
                  photoUrl={victim.photo_url}
                />
              ))}

            </div>
          )}

        </Section>

        {/* ================================================= */}
        {/* SUSPECTS */}
        {/* ================================================= */}

        <Section
          label="Suspects"
          title="Suspect details"
          icon={<Users size={18} />}
        >

          {data.suspects.length === 0 ? (
            <EmptySection text="No suspect details available." />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">

              {data.suspects.map((suspect) => (
                <PersonCard
                  key={suspect.suspect_id}
                  name={
                    suspect.name ||
                    "Unknown suspect"
                  }
                  contact={suspect.contact}
                  type={suspect.type}
                  address={suspect.address}
                  description={
                    suspect.description
                  }
                  status={suspect.status}
                  photoUrl={suspect.photo_url}
                />
              ))}

            </div>
          )}

        </Section>

        {/* ================================================= */}
        {/* EVIDENCE */}
        {/* ================================================= */}

        <Section
          label="Evidence"
          title="Complaint evidence"
          icon={<FileText size={18} />}
        >

          {data.evidence.length === 0 ? (
            <EmptySection text="No evidence uploaded for this complaint." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">

              {data.evidence.map((item) => (
                <EvidenceCard
                  key={item.evidence_id}
                  evidence={item}
                />
              ))}

            </div>
          )}

        </Section>

      </div>
    </div>
  );
}

