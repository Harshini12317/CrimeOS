import { sql } from "@/lib/db";
import LegalReviewClient, { type LegalRequest } from "@/components/legal/LegalReviewClient";
export const dynamic = "force-dynamic";

async function getRequests(): Promise<LegalRequest[]> {
  // investigation_suggestions.case_id -> cases.case_id
  // investigation_suggestions.complaint_id -> complaints.complaint_id (direct, no need to hop through cases)
  const rows = await sql`
    select
      s.id, s.case_id, s.complaint_id,
      s.suggested_path, s.recommended_sections, s.case_law_refs,
      s.officer_feedback, s.officer_feedback_notes,
      s.model_used, s.generated_at, s.created_by,
      c.case_number, c.title as case_title, c.status as case_status,
      c.district, c.police_station, c.fir_no,
      cp.ai_summary, cp.description as complaint_description,
      cp.crime_type, cp.complaint_type
    from investigation_suggestions s
    left join cases c on c.case_id = s.case_id
    left join complaints cp on cp.complaint_id = s.complaint_id
    order by s.generated_at desc
  `;

  return (rows as any[]).map((r) => ({
    id: r.id,
    caseId: r.case_id,
    complaintId: r.complaint_id,
    caseNumber: r.case_number,
    // cases.title if present, else fall back to complaint's crime_type/complaint_type
    title: r.case_title ?? r.crime_type ?? r.complaint_type ?? "Untitled case",
    complaintSummary: r.ai_summary ?? r.complaint_description ?? "",
    caseStatus: r.case_status,
    district: r.district,
    policeStation: r.police_station,
    firNo: r.fir_no,
    generatedAt: r.generated_at
      ? new Date(r.generated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : null,
    modelUsed: r.model_used,
    createdBy: r.created_by,
    // JSONB columns come back already parsed as JS arrays/objects from @neondatabase/serverless
    suggestedPath: r.suggested_path ?? [],
    recommendedSections: r.recommended_sections ?? [],
    caseLawRefs: r.case_law_refs ?? [],
    officerFeedback: r.officer_feedback,
    officerFeedbackNotes: r.officer_feedback_notes,
  }));
}

export default async function LegalReviewPage() {
  const requests = await getRequests();

  return (
    <div className="p-8 max-w-7xl mx-auto">
        
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-maroon-900">Legal Review</h1>
        <p className="text-sm text-gray-600 mt-1">
          Verify AI suggested sections, review legal requests, add legal opinion.
        </p>
      </div>
      <LegalReviewClient requests={requests} />
    </div>
  );
}