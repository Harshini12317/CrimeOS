import { sql } from "@/lib/db";
import IoLegalRequestsClient, {
  type IOLegalRequest,
} from "@/components/legal/Iolegalrequestsclient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/app/types/Auth"; // adjust path if your alias differs from "../types/Auth"
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout"; // adjust path if your alias differs from "../dashboard/layout"
export const dynamic = "force-dynamic";

const NEXT_PUBLIC_BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000/api";

// Mirrors app/api/auth/me/route.ts, but called directly from the server
// component instead of round-tripping through that API route.
async function getCurrentUser(): Promise<User> {
  const token = (await cookies()).get("crimeos_token")?.value;
  if (!token) redirect("/login");

  let res: Response;
  try {
    res = await fetch(`${NEXT_PUBLIC_BACKEND_API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new Error(`Could not reach backend at ${NEXT_PUBLIC_BACKEND_API_URL}. Is it running?`);
  }

  if (!res.ok) redirect("/login");

  return res.json();
}

async function getRequestsForIO(ioUserId: User["id"]): Promise<IOLegalRequest[]> {
  // investigation_suggestions.created_by is assumed to hold the id of the
  // IO who requested the suggestion — same column the legal-review page
  // already selects, just used here as a filter instead of a display field.
  const rows = await sql`
    select
      s.id, s.case_id, s.complaint_id,
      s.suggested_path, s.recommended_sections, s.case_law_refs,
      s.officer_feedback, s.officer_feedback_notes,
      s.model_used, s.generated_at, s.created_by,
      c.case_number, c.title as case_title, c.status as case_status,
      c.district, c.police_station, c.fir_no,
      cp.ai_summary, cp.description as complaint_description,
      cp.crime_category, cp.complaint_type
    from investigation_suggestions s
    left join cases c on c.case_id = s.case_id
    left join complaints cp on cp.complaint_id = s.complaint_id
    where s.created_by = ${ioUserId}
    order by s.generated_at desc
  `;

  return (rows as any[]).map((r) => ({
    id: r.id,
    caseId: r.case_id,
    complaintId: r.complaint_id,
    caseNumber: r.case_number,
    title: r.case_title ?? r.crime_category ?? r.complaint_type ?? "Untitled case",
    complaintSummary: r.ai_summary ?? r.complaint_description ?? "",
    caseStatus: r.case_status,
    district: r.district,
    policeStation: r.police_station,
    firNo: r.fir_no,
    generatedAt: r.generated_at
      ? new Date(r.generated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : null,
    modelUsed: r.model_used,
    // JSONB columns come back already parsed as JS arrays/objects from @neondatabase/serverless
    suggestedPath: r.suggested_path ?? [],
    recommendedSections: r.recommended_sections ?? [],
    caseLawRefs: r.case_law_refs ?? [],
    officerFeedback: r.officer_feedback,
    officerFeedbackNotes: r.officer_feedback_notes,
  }));
}

export default async function IOLegalRequestsPage() {
  const user = await getCurrentUser();
  const requests = await getRequestsForIO(user.id);

  return (
    <>
    <DashboardLayout>
    <div className="min-h-screen flex bg-gray-50">
        <div className="sticky top-0 h-screen overflow-y-auto">
                <Sidebar />
                </div>
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-maroon-900">My Legal Requests</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track the Legal Advisor's decision — approved, rejected, or needs more info — on the
          investigation suggestions you requested.
        </p>
      </div>
      <IoLegalRequestsClient requests={requests} />
    </div>
    </div>
    </DashboardLayout>
    </>
  );
}