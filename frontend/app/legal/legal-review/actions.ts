"use server";

import { sql } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ReviewDecision = "accepted" | "rejected" | "needs_more_info";

// Chosen defaults for cases.status on each decision (you said "use sensible
// defaults" — these are easy to rename in one place if your app already
// uses different vocabulary elsewhere for case status).
// `needs_more_info` intentionally does NOT change cases.status — the case
// stays in whatever state it was in until the officer gives a final verdict.
const CASE_STATUS_BY_DECISION: Partial<Record<ReviewDecision, string>> = {
  accepted: "Legally Cleared",
  rejected: "Legal Review Rejected",
};

export async function submitReviewDecision(
  suggestionId: string,
  caseId: string | null,
  decision: ReviewDecision,
  notes: string
) {
  await sql`
    update investigation_suggestions
    set officer_feedback = ${decision},
        officer_feedback_notes = ${notes || null}
    where id = ${suggestionId}
  `;

  const newCaseStatus = CASE_STATUS_BY_DECISION[decision];
  if (caseId && newCaseStatus) {
    await sql`
      update cases
      set status = ${newCaseStatus},
          updated_at = now()
      where case_id = ${caseId}
    `;
  }

  // TODO: if there's a notifications/audit table, log who made this
  // decision and when — investigation_suggestions has no reviewer-id
  // column today, only officer_feedback / officer_feedback_notes.

  revalidatePath("/legal/legal-review");
}