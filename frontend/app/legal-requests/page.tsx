"use client";

import { FormEvent, useState } from "react";
import {
  FileText,
  Mail,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  generateLegalRequest,
  sendLegalRequest,
  LegalRequest,
} from "./api";

const AGENCY_OPTIONS = [
  {
    value: "BANK",
    label: "Bank",
  },
  {
    value: "TELECOM",
    label: "Telecom Provider",
  },
  {
    value: "SOCIAL_MEDIA",
    label: "Social Media Platform",
  },
  {
    value: "ISP",
    label: "Internet Service Provider",
  },
  {
    value: "FORENSIC_LAB",
    label: "Forensic Laboratory",
  },
];

const REQUEST_TYPE_OPTIONS = [
  {
    value: "TRANSACTION_DETAILS",
    label: "Transaction Details",
  },
  {
    value: "ACCOUNT_DETAILS",
    label: "Account Details",
  },
  {
    value: "CALL_RECORDS",
    label: "Call Records",
  },
  {
    value: "SUBSCRIBER_DETAILS",
    label: "Subscriber Details",
  },
  {
    value: "IP_LOGS",
    label: "IP Logs",
  },
];

export default function LegalRequestsPage() {
  const [caseId, setCaseId] = useState(
    "CASE-TEST-CMP-000002"
  );

  const [agencyType, setAgencyType] = useState("BANK");

  const [agencyName, setAgencyName] = useState(
    "HDFC Bank"
  );

  const [recipientEmail, setRecipientEmail] = useState(
    "harshini12318@gmail.com"
  );

  const [requestType, setRequestType] = useState(
    "TRANSACTION_DETAILS"
  );

  const [generatedRequest, setGeneratedRequest] =
    useState<LegalRequest | null>(null);

  const [loading, setLoading] = useState(false);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================================
  // GENERATE
  // ======================================================

  async function handleGenerate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setGeneratedRequest(null);

    if (!caseId.trim()) {
      setError("Case ID is required.");
      return;
    }

    if (!agencyName.trim()) {
      setError("Agency name is required.");
      return;
    }

    if (!recipientEmail.trim()) {
      setError("Recipient email is required.");
      return;
    }

    setLoading(true);

    try {
      const result = await generateLegalRequest({
        case_id: caseId.trim(),
        agency_type: agencyType,
        agency_name: agencyName.trim(),
        recipient_email: recipientEmail.trim(),
        request_type: requestType,
      });

      setGeneratedRequest(result);

      setSuccess(
        "Legal request generated successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate legal request."
      );
    } finally {
      setLoading(false);
    }
  }

  // ======================================================
  // SEND
  // ======================================================

  async function handleSend() {
    if (!generatedRequest) {
      return;
    }

    setError("");
    setSuccess("");
    setSending(true);

    try {
      const result = await sendLegalRequest(
        generatedRequest.request_id
      );

      setGeneratedRequest((previous) =>
        previous
          ? {
              ...previous,
              ...result,
              status: result.status || "SENT",
            }
          : previous
      );

      setSuccess(
        "Legal request sent successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send legal request."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-ivory px-6 py-8">
      <div className="mx-auto max-w-6xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-maroon-600 p-3 text-white">
              <FileText className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-ink-900">
                Legal Requests
              </h1>

              <p className="mt-1 text-sm text-ink-600">
                Generate and send official information
                requests to external agencies.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Success
              </p>

              <p className="mt-1 text-sm">
                {success}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">

          {/* ==================================================
              FORM
          ================================================== */}

          <section className="lg:col-span-2">
            <div className="rounded-xl border border-gold-200 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-ink-900">
                  Create Legal Request
                </h2>

                <p className="mt-1 text-sm text-ink-600">
                  Enter the details required to generate
                  the official request.
                </p>
              </div>

              <form
                onSubmit={handleGenerate}
                className="space-y-5"
              >

                {/* CASE ID */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-900">
                    Case ID
                  </label>

                  <input
                    value={caseId}
                    onChange={(e) =>
                      setCaseId(e.target.value)
                    }
                    placeholder="Enter case ID"
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  />

                  <p className="mt-1 text-xs text-ink-500">
                    Temporary manual input. We will connect
                    this to the Case page later.
                  </p>
                </div>

                {/* AGENCY TYPE */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-900">
                    Agency Type
                  </label>

                  <select
                    value={agencyType}
                    onChange={(e) =>
                      setAgencyType(e.target.value)
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  >
                    {AGENCY_OPTIONS.map((agency) => (
                      <option
                        key={agency.value}
                        value={agency.value}
                      >
                        {agency.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* AGENCY NAME */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-900">
                    Agency Name
                  </label>

                  <input
                    value={agencyName}
                    onChange={(e) =>
                      setAgencyName(e.target.value)
                    }
                    placeholder="e.g. HDFC Bank"
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  />
                </div>

                {/* EMAIL */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-900">
                    Recipient Email
                  </label>

                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) =>
                      setRecipientEmail(e.target.value)
                    }
                    placeholder="agency@example.com"
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  />
                </div>

                {/* REQUEST TYPE */}

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-900">
                    Request Type
                  </label>

                  <select
                    value={requestType}
                    onChange={(e) =>
                      setRequestType(e.target.value)
                    }
                    className="w-full rounded-md border border-gold-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none focus:border-maroon-600 focus:ring-1 focus:ring-maroon-600"
                  >
                    {REQUEST_TYPE_OPTIONS.map((request) => (
                      <option
                        key={request.value}
                        value={request.value}
                      >
                        {request.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GENERATE */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-maroon-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate Legal Request
                    </>
                  )}
                </button>

              </form>
            </div>
          </section>

          {/* ==================================================
              RESULT
          ================================================== */}

          <section className="lg:col-span-3">

            {!generatedRequest ? (
              <div className="flex min-h-[500px] items-center justify-center rounded-xl border border-dashed border-gold-300 bg-white p-8 text-center">

                <div>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-50">
                    <FileText className="h-7 w-7 text-maroon-600" />
                  </div>

                  <h3 className="font-semibold text-ink-900">
                    No Legal Request Generated
                  </h3>

                  <p className="mt-2 max-w-sm text-sm text-ink-600">
                    Fill in the request details and click
                    "Generate Legal Request".
                  </p>
                </div>

              </div>
            ) : (
              <div className="space-y-5">

                {/* REQUEST SUMMARY */}

                <div className="rounded-xl border border-gold-200 bg-white p-6 shadow-sm">

                  <div className="flex items-start justify-between gap-4 border-b border-gold-200 pb-4">

                    <div>
                      <h2 className="text-lg font-semibold text-ink-900">
                        Legal Request Generated
                      </h2>

                      <p className="mt-1 text-xs text-ink-500">
                        Request ID:{" "}
                        {generatedRequest.request_id}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        generatedRequest.status ===
                        "SENT"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {generatedRequest.status}
                    </span>

                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">

                    <Info
                      label="Agency"
                      value={
                        generatedRequest.agency_name
                      }
                    />

                    <Info
                      label="Recipient"
                      value={
                        generatedRequest.recipient_email
                      }
                    />

                    <Info
                      label="Case ID"
                      value={
                        generatedRequest.case_id
                      }
                    />

                    <Info
                      label="Complaint ID"
                      value={
                        generatedRequest.complaint_id
                      }
                    />

                    <div className="sm:col-span-2">
                      <Info
                        label="Subject"
                        value={
                          generatedRequest.subject
                        }
                      />
                    </div>

                  </div>

                </div>

                {/* BODY */}

                {generatedRequest.body && (
                  <div className="rounded-xl border border-gold-200 bg-white p-6 shadow-sm">

                    <h3 className="mb-4 border-b border-gold-200 pb-3 text-sm font-semibold text-ink-900">
                      Request Preview
                    </h3>

                    <pre className="whitespace-pre-wrap rounded-lg bg-ivory p-4 text-sm leading-6 text-ink-700">
                      {generatedRequest.body}
                    </pre>

                  </div>
                )}

                {/* ACTIONS */}

                <div className="rounded-xl border border-gold-200 bg-white p-6 shadow-sm">

                  <h3 className="mb-4 text-sm font-semibold text-ink-900">
                    Actions
                  </h3>

                  <div className="flex flex-wrap gap-3">

                    {generatedRequest.document_url && (
                      <a
                        href={
                          generatedRequest.document_url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border border-gold-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 transition hover:bg-ivory"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View PDF
                      </a>
                    )}

                    {generatedRequest.status !==
                      "SENT" && (
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending}
                        className="flex items-center gap-2 rounded-md bg-maroon-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-maroon-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            Send Email
                          </>
                        )}
                      </button>
                    )}

                  </div>

                  {generatedRequest.status ===
                    "SENT" && (
                    <div className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      This legal request has been sent
                      successfully.
                    </div>
                  )}

                </div>

              </div>
            )}

          </section>

        </div>
      </div>
    </main>
  );
}


// ==========================================================
// SMALL INFO COMPONENT
// ==========================================================

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-ink-900">
        {value || "Not available"}
      </p>
    </div>
  );
}