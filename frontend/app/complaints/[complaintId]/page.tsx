"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";


interface ComplaintDetail {
  complaint_id: string;
  complaint_number: string;
  complaint_title?: string;
  complaint_mode?: string;
  priority?: string;
  emergency?: string;
  
  complainant_name?: string;
  complainant_father_name?: string;
  complainant_age?: string;
  complainant_gender?: string;
  complainant_address?: string;
  complainant_aadhaar?: string;
  complainant_relationship?: string;
  complainant_occupation?: string;
  complainant_nationality?: string;
  complainant_photo_url?: string;
  complainant_photo_name?: string;
  
  phone?: string;
  email?: string;
  crime_category?: string;
  crime_subcategory?: string;
  location?: string;
  landmark?: string;
  description?: string;
  status?: string;
  is_draft?: boolean;
  created_at?: string;
  incident_datetime?: string;
  incident_date?: string;
  incident_time?: string;
  ai_summary?: string;
  officer_notes?: string;
  notes?: string;
  aiSummary?: string;
  officerNotes?: string;
  attachments?: Array<{
    id?: string;
    fileName?: string;
    fileType?: string;
    documentUrl?: string;
    cloudinaryUrl?: string;
    url?: string;
    document_url?: string;
    extractedText?: string;
    summary?: string;
  }>;
  complainants?: Array<any>;
  victims?: Array<any>;
  suspects?: Array<any>;
  documents?: Array<any>;
}

export default function ComplaintPage() {
  const params = useParams();
  const complaintId = ((params as Record<string, string | string[] | undefined>)?.complaintId as string | undefined) ?? "";
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [caseExists, setCaseExists] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [creatingCase, setCreatingCase] = useState(false);
  const [caseActionError, setCaseActionError] = useState<string | null>(null);

  const handleCreateCase = async () => {
    if (!complaintId || !complaint) return;

    setCreatingCase(true);
    setCaseActionError(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
      const res = await axios.post(`${API_BASE}/api/cases`, {
        complaint_id: complaint.complaint_id || complaintId,
        complaint_number: complaint.complaint_number,
        title: complaint.complaint_title || `Case for ${complaint.complaint_number}`,
        priority: complaint.status || "Medium",
      });

      const newCaseId = res?.data?.data?.case_id || null;
      setCaseExists(true);
      setCaseId(newCaseId);
    } catch (err: any) {
      console.error(err);
      setCaseActionError(err?.response?.data?.detail || err?.message || "Unable to create case");
    } finally {
      setCreatingCase(false);
    }
  };

  useEffect(() => {
    if (!complaintId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
        const [cRes, caseRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/api/complaints/${encodeURIComponent(complaintId)}`),
          axios.get(`${API_BASE}/api/cases/by-complaint/${encodeURIComponent(complaintId)}`),
        ]);

        if (cRes.status === "fulfilled") {
          const data = (cRes.value as any).data;
          const complaintData = data?.complaint || data;
          setComplaint(complaintData || null);
        }

        if (caseRes.status === "fulfilled") {
          const data = (caseRes.value as any).data;
          setCaseExists(true);
          setCaseId(data.case_id || null);
        } else {
          setCaseExists(false);
        }
      } catch (err: any) {
        console.error(err);
        setError(err?.response?.data?.detail || err?.message || String(err));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [complaintId]);

  // debug: log the complaint object returned by the API
  useEffect(() => {
    if (complaint) {
      // eslint-disable-next-line no-console
      console.log("Loaded complaint:", complaint);
    }
  }, [complaint]);

  if (loading) return (
    <div className="min-h-screen bg-slate-100">
  
      <div className="flex">
    
        <main className="flex-1 p-6 lg:p-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading complaint...</div>
        </main>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-100">

      <div className="flex">
      
        <main className="flex-1 p-6 lg:p-8">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
        </main>
      </div>
    </div>
  );

  if (!complaint) return (
    <div className="min-h-screen bg-slate-100">
  
      <div className="flex">
       
        <main className="flex-1 p-6 lg:p-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Complaint not found.</div>
        </main>
      </div>
    </div>
  );

  const complainantPhotoUrl = complaint.complainant_photo_url || (complaint as any).complainantPhotoUrl || "";
  const complainantPhotoName = complaint.complainant_photo_name || (complaint as any).complainantPhotoName || "";

  const mergedAttachments = [
    ...(complaint.attachments || []),
    ...((complaint.documents || []) as any[]).map((doc) => ({
      id: String(doc.document_id || doc.id || doc.fileName || Math.random()),
      fileName: doc.fileName || doc.title || "Document",
      fileType: doc.fileType || doc.document_type || "document",
      documentUrl: doc.documentUrl || doc.cloudinaryUrl || doc.filePath || doc.file_path,
      cloudinaryUrl: doc.cloudinaryUrl || doc.filePath || doc.file_path,
      url: doc.url || doc.documentUrl || doc.filePath || doc.file_path,
      document_url: (doc as any).document_url || undefined,
      summary: (doc as any).summary || undefined,
    })),
  ];

  return (
    <div className="min-h-screen bg-slate-100">

      <div className="flex">
        <main className="flex-1 p-6 lg:p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {complaint.complaint_title || `Complaint ${complaint.complaint_number}`}
                  </h1>
                  {complaint.is_draft && (
                    <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-500">{complaint.status || "Pending"}</p>
              </div>
              <div className="text-right text-sm text-slate-500">{complaint.created_at ? new Date(complaint.created_at).toLocaleString() : "No date"}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow space-y-6">
              {/* Complaint Information Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Complaint Information</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Complaint Number</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.complaint_number || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Complaint Mode</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.complaint_mode || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Priority</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.priority || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Emergency</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.emergency || "No"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Crime Category</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.crime_category || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Crime Sub-Category</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.crime_subcategory || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Incident Details Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Incident Details</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Incident Date</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.incident_date ? new Date(complaint.incident_date).toLocaleDateString() : "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Incident Time</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.incident_time || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Location</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.location || "Not provided"}</p>
                  </div>
                  {complaint.landmark && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Landmark</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.landmark}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Complainant Details Section */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Complainant Details</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Full Name</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.complainant_name || "Not provided"}</p>
                  </div>
                  {complaint.complainant_father_name && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Father's Name</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.complainant_father_name}</p>
                    </div>
                  )}
                  {complaint.complainant_age && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Age</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.complainant_age}</p>
                    </div>
                  )}
                  {complaint.complainant_gender && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Gender</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.complainant_gender}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-700">Phone</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Email</p>
                    <p className="mt-1 text-sm text-slate-600">{complaint.email || "-"}</p>
                  </div>
                  {complaint.complainant_occupation && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Occupation</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.complainant_occupation}</p>
                    </div>
                  )}
                  {complaint.complainant_nationality && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Nationality</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.complainant_nationality}</p>
                    </div>
                  )}
                  {complaint.complainant_relationship && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Relationship to Case</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.complainant_relationship}</p>
                    </div>
                  )}
                  {complaint.complainant_aadhaar && (
                    <div>
                      <p className="text-sm font-medium text-slate-700">Aadhaar Number</p>
                      <p className="mt-1 text-sm text-slate-600">{complaint.complainant_aadhaar}</p>
                    </div>
                  )}
                </div>
                {complaint.complainant_address && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700">Address</p>
                    <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{complaint.complainant_address}</p>
                  </div>
                )}
                {complainantPhotoUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Photo</p>
                    <img src={complainantPhotoUrl} alt={complainantPhotoName || "Complainant photo"} className="max-h-48 rounded-lg" />
                    {complainantPhotoName ? (
                      <p className="mt-2 text-sm text-slate-500">{complainantPhotoName}</p>
                    ) : null}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Incident Description</h2>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{complaint.description || "Not provided"}</p>
              </div>

              {(complaint.ai_summary || complaint.aiSummary) && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Summary</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{complaint.ai_summary || complaint.aiSummary}</p>
                </div>
              )}

              {(complaint.officer_notes || complaint.officerNotes) && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Officer Notes</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{complaint.officer_notes || complaint.officerNotes}</p>
                </div>
              )}

              {(complaint.attachments && complaint.attachments.length > 0) || (complaint.documents && complaint.documents.length > 0) ? (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Attachments & Evidence</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {mergedAttachments.map((att) => {
                      const url = att.documentUrl || att.cloudinaryUrl || att.url || (att as any).document_url;
                      const safeUrl = url ? encodeURI(url) : undefined;
                      const isImage = (att.fileType || "").startsWith("image") || (safeUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(safeUrl));

                      return (
                        <div key={att.id || att.fileName} className="rounded-xl border bg-white p-3 text-sm shadow-sm">
                          <p className="font-semibold text-slate-900">{att.fileName || "Document"}</p>
                          <p className="text-xs text-slate-500">{att.fileType || "—"}</p>
                          {isImage && safeUrl ? (
                            <a href={safeUrl} target="_blank" rel="noreferrer noopener">
                              <img src={safeUrl} alt={att.fileName || "attachment"} className="mt-2 max-h-40 w-full object-contain" />
                            </a>
                          ) : safeUrl ? (
                            <a href={safeUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-block text-indigo-600 hover:underline">Open document</a>
                          ) : att.summary ? (
                            <p className="mt-2 text-slate-600">{att.summary}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {complaint.complainants && complaint.complainants.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Complainants</h2>
                  <div className="space-y-3">
                    {complaint.complainants.map((c: any, idx: number) => (
                      <div key={idx} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                        <p className="font-semibold text-slate-900">{c.name || `Complainant ${idx + 1}`}</p>
                        <p className="text-sm text-slate-600">Contact: {c.contact || "—"}</p>
                        {c.statement && <p className="text-sm text-slate-600 mt-2">Statement: {c.statement}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {complaint.victims && complaint.victims.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Victims</h2>
                  <div className="space-y-3">
                    {complaint.victims.map((v: any, idx: number) => (
                      <div key={v.victim_id || idx} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{v.fullName || `Victim ${idx + 1}`}</p>
                            <div className="grid gap-2 sm:grid-cols-2 mt-2 text-sm text-slate-600">
                              <p>Age: {v.age || "—"}</p>
                              <p>Gender: {v.gender || "—"}</p>
                              <p className="sm:col-span-2">Address: {v.address || "—"}</p>
                              {v.injuries && <p className="sm:col-span-2">Injuries: {v.injuries}</p>}
                            </div>
                          </div>
                          {(v.photoUrl || v.photo_url) ? (
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-slate-700">Photo</p>
                              <img src={v.photoUrl || v.photo_url} alt={`Victim ${idx + 1}`} className="mt-2 max-h-40 w-full rounded-xl object-cover border" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {complaint.suspects && complaint.suspects.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Suspects</h2>
                  <div className="space-y-3">
                    {complaint.suspects.map((s: any, idx: number) => (
                      <div key={s.suspect_id || idx} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{s.fullName || `Suspect ${idx + 1}`}</p>
                            <div className="grid gap-2 sm:grid-cols-2 mt-2 text-sm text-slate-600">
                              <p>Alias: {s.alias || "—"}</p>
                              <p>Gender: {s.gender || "—"}</p>
                              <p className="sm:col-span-2">Address: {s.presentAddress || s.permanentAddress || "—"}</p>
                            </div>
                          </div>
                          {(s.photoUrl || s.photo_url) ? (
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-slate-700">Photo</p>
                              <img src={s.photoUrl || s.photo_url} alt={`Suspect ${idx + 1}`} className="mt-2 max-h-40 w-full rounded-xl object-cover border" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {complaint.notes && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Additional Notes</h2>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{complaint.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow">
                <Link href="/complaints" className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back to list</Link>

                {complaint.is_draft ? (
                  <Link href={`/complaints/${complaint.complaint_id}/submit`} className="inline-flex items-center rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
                    Submit Draft
                  </Link>
                ) : caseExists ? (
                  <Link href={`/cases/${caseId}`} className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">View case</Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateCase}
                    disabled={creatingCase}
                    className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {creatingCase ? "Creating case..." : "Create case"}
                  </button>
                )}

                {caseActionError ? (
                  <p className="text-sm text-rose-600 ml-auto">{caseActionError}</p>
                ) : null}
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}