/**
 * API client for the Case Summary page.
 *
 * Talks directly to the FastAPI backend (client-side fetch), per:
 *  - GET  /api/cases/my-cases                                 (cases.py)
 *  - GET  /api/complaints/{complaint_id}                      (complaint.py)
 *  - POST /api/complaints/{complaint_id}/legal-sections/analyze (legal_section_intelligence.py)
 *
 * ASSUMPTION: auth is session/cookie based, so every request is sent with
 * `credentials: "include"`. If this backend actually uses a bearer token
 * (JWT in localStorage, etc.) instead, add it in `authHeaders()` below —
 * that's the only place that needs to change.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function authHeaders(): Record<string, string> {
  // e.g. return { Authorization: `Bearer ${getToken()}` };
  return {};
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...(init?.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    let detail = res.statusText || `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(res.status, detail);
  }

  // 204 / empty body
  const text = await res.text();
  return (text ? JSON.parse(text) : (undefined as unknown)) as T;
}

// ---------------------------------------------------------------------------
// Types — mirrored exactly from the backend response shapes given to us.
// ---------------------------------------------------------------------------

export interface CaseListItem {
  case_id: string;
  complaint_id: string;
  case_number: string;
  title: string;
  status: string;
  priority: string;
  description: string;
  current_stage: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface ComplaintRecord {
  complaint_id: string;
  complaint_number: string;
  complaint_type: string;
  crime_category: string;
  crime_subcategory: string;
  priority: string;
  incident_date: string | null;
  incident_time: string | null;
  location: string | null;
  description: string;
  ai_summary: string | null;
  officer_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ComplainantRecord {
  complainant_id: string;
  name: string;
  contact: string | null;
  relationship: string | null;
  statement: string | null;
  type: string | null;
  address: string | null;
}

export interface VictimRecord {
  victim_id: string;
  name: string;
  contact: string | null;
  relationship: string | null;
  statement: string | null;
  type: string | null;
  description: string | null;
  address: string | null;
  photo_url: string | null;
}

export interface SuspectRecord {
  suspect_id: string;
  name: string;
  contact: string | null;
  description: string | null;
  status: string | null;
  type: string | null;
  address: string | null;
  photo_url: string | null;
}

export interface EvidenceRecord {
  evidence_id: string;
  evidence_type: string;
  file_name: string | null;
  file_type: string | null;
  cloudinary_url: string | null;
  cloudinary_public_id: string | null;
  extracted_text: string | null;
  summary: string | null;
  extraction_data: unknown;
  created_at: string | null;
}

export interface ComplaintDetailResponse {
  complaint: ComplaintRecord;
  complainants: ComplainantRecord[];
  victims: VictimRecord[];
  suspects: SuspectRecord[];
  evidence: EvidenceRecord[];
}

export interface CrossReference {
  act: string | null;
  section: string | null;
  subject: string | null;
  summary_of_comparison: string | null;
}

export interface LegalSectionResult {
  id: string;
  act_code: string;
  section_number: string;
  title: string;
  section_text: string | null;
  category: string | null;
  similarity: number;
  reason: string;
  cross_references: CrossReference[];
}

export interface JudgmentResult {
  id: string;
  case_title: string;
  court: string | null;
  case_date: string | null;
  ipc_sections: string | null;
  crime_type: string | null;
  summary: string | null;
  judgment_reason: string | null;
  bail_outcome: string | null;
  similarity: number;
  reason: string;
}

export interface AnalyzeResponse {
  complaint_id: string;
  case_summary: string;
  sections: LegalSectionResult[];
  judgments: JudgmentResult[];
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

export function getMyCases(): Promise<CaseListItem[]> {
  return apiFetch<CaseListItem[]>("/api/cases/my-cases");
}

export function getComplaintDetail(complaintId: string): Promise<ComplaintDetailResponse> {
  return apiFetch<ComplaintDetailResponse>(`/api/complaints/${complaintId}`);
}

export function analyzeLegalSections(
  complaintId: string,
  caseSummary?: string | null
): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>(`/api/complaints/${complaintId}/legal-sections/analyze`, {
    method: "POST",
    body: JSON.stringify({ case_summary: caseSummary ?? null }),
  });
}