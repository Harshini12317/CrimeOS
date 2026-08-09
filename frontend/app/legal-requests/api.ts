const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface GenerateLegalRequestPayload {
  case_id: string;
  agency_type: string;
  agency_name: string;
  recipient_email: string;
  request_type: string;
}

export interface LegalRequest {
  request_id: string;
  case_id: string;
  complaint_id: string;
  agency_type: string;
  agency_name: string;
  recipient_email: string;
  subject: string;
  body?: string;
  document_url?: string | null;
  status: string;
  sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Generate a new legal request.
 */
export async function generateLegalRequest(
  data: GenerateLegalRequestPayload
): Promise<LegalRequest> {
  const response = await fetch(
    `${API_BASE_URL}/api/legal-requests/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.detail || "Failed to generate legal request"
    );
  }

  return result;
}

/**
 * Send an existing legal request by email.
 */
export async function sendLegalRequest(
  requestId: string
): Promise<LegalRequest> {
  const response = await fetch(
    `${API_BASE_URL}/api/legal-requests/${requestId}/send`,
    {
      method: "POST",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.detail || "Failed to send legal request"
    );
  }

  return result;
}

/**
 * Get all legal requests belonging to a case.
 */
export async function getCaseLegalRequests(
  caseId: string
): Promise<LegalRequest[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/legal-requests/case/${caseId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.detail || "Failed to fetch legal requests"
    );
  }

  return result;
}

/**
 * Get a single legal request.
 */
export async function getLegalRequest(
  requestId: string
): Promise<LegalRequest> {
  const response = await fetch(
    `${API_BASE_URL}/api/legal-requests/${requestId}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.detail || "Failed to fetch legal request"
    );
  }

  return result;
}