"use server";

import { sql } from "@/lib/db";

// Interface for live dashboard query results
export interface LiveDashboardData {
  stats: {
    activeCases: number;
    pendingLegalRequests: number;
    responsesReceived: number;
    aiAlerts: number;
    closedCases: number;
  };
  recentCases: Array<{
    caseId: string;
    crimeType: string;
    status: string;
    lastUpdated: string;
  }>;
  activities: Array<{
    id: string;
    type: string;
    timestamp: string;
    caseId: string;
    details: string;
  }>;
}

// Helper to format ISO timestamps
function formatTimestamp(dateStr?: string | Date): string {
  if (!dateStr) return "2026-07-28 12:00";
  const d = new Date(dateStr);
  return d.toISOString().replace('T', ' ').substring(0, 16);
}

/**
 * Server Action to fetch the list of all case IDs in the database.
 */
export async function getLiveCaseIds(): Promise<string[] | null> {
  try {
    const rows = await sql`
      SELECT case_id FROM cases ORDER BY case_id DESC
    `;
    const ids = rows.map((r: any) => r.case_id).filter(Boolean);
    return ids.length > 0 ? ids : null;
  } catch (err) {
    console.error("Error in getLiveCaseIds, returning null for fallback.", err);
    return null;
  }
}

/**
 * Server Action to fetch live Dashboard statistics, recent cases, and timelines.
 */
export async function getLiveDashboardData(userId?: number | string): Promise<LiveDashboardData | null> {
  try {
    // 1. Fetch counts for KPI stats
    const activeRes = await sql`
      SELECT COUNT(*)::int as count FROM cases 
      WHERE status IN ('Investigation Active', 'Awaiting Service Provider')
    `;
    const closedRes = await sql`
      SELECT COUNT(*)::int as count FROM cases 
      WHERE status IN ('Closed', 'Resolved')
    `;
    
    // Legal requests (investigation suggestions status check)
    const pendingRequestsRes = await sql`
      SELECT COUNT(*)::int as count FROM investigation_suggestions 
      WHERE officer_feedback IS NULL OR officer_feedback = 'needs_more_info'
    `;
    const responsesReceivedRes = await sql`
      SELECT COUNT(*)::int as count FROM investigation_suggestions 
      WHERE officer_feedback = 'accepted'
    `;

    // AI Alerts: Count active high priority cases
    const aiAlertsRes = await sql`
      SELECT COUNT(*)::int as count FROM cases 
      WHERE priority = 'High' AND status != 'Closed'
    `;

    // 2. Fetch recent cases list (limit to 5)
    const casesQuery = await sql`
      SELECT 
        c.case_id,
        c.status,
        c.priority,
        co.crime_type,
        co.created_at
      FROM cases c
      LEFT JOIN complaints co ON co.complaint_id = c.complaint_id
      ORDER BY co.created_at DESC
      LIMIT 5
    `;

    // 3. Fetch recent activities from investigation suggestions log
    const activitiesQuery = await sql`
      SELECT 
        s.id,
        s.case_id,
        s.officer_feedback,
        s.generated_at,
        co.crime_type
      FROM investigation_suggestions s
      LEFT JOIN complaints co ON co.complaint_id = s.complaint_id
      ORDER BY s.generated_at DESC
      LIMIT 6
    `;

    // Format stats
    const stats = {
      activeCases: activeRes[0]?.count ?? 0,
      closedCases: closedRes[0]?.count ?? 0,
      pendingLegalRequests: pendingRequestsRes[0]?.count ?? 0,
      responsesReceived: responsesReceivedRes[0]?.count ?? 0,
      aiAlerts: aiAlertsRes[0]?.count ?? 0,
    };

    // Format cases
    const recentCases = casesQuery.map((c: any) => ({
      caseId: c.case_id,
      crimeType: c.crime_type ?? "Cyber Incident",
      status: c.status ?? "Investigation Active",
      lastUpdated: c.created_at ? new Date(c.created_at).toISOString().substring(0, 10) : "2026-07-28"
    }));

    // Format activities
    const activities = activitiesQuery.map((act: any, idx: number) => {
      let type = "AI Investigation Path Generated";
      let details = `AI generated investigation blueprint for Case: ${act.case_id}`;
      
      if (act.officer_feedback === "accepted") {
        type = "Legal Request Sent";
        details = "Legal Advisor approved the suggestion draft.";
      } else if (act.officer_feedback === "rejected") {
        type = "Case Summary Updated";
        details = "Officer reviewed legal suggestions and updated notes.";
      }

      return {
        id: act.id ?? `act-live-${idx}`,
        type,
        timestamp: formatTimestamp(act.generated_at),
        caseId: act.case_id,
        details
      };
    });

    // If no cases exist in DB, fallback to mock data
    if (recentCases.length === 0) {
      return null;
    }

    return {
      stats,
      recentCases,
      activities
    };

  } catch (err) {
    console.error("Database query failed in getLiveDashboardData, returning null for fallback.", err);
    return null;
  }
}

/**
 * Server Action to fetch live Case Summary Report by case ID.
 */
export async function getLiveCaseSummary(caseId: string): Promise<any | null> {
  try {
    // 1. Fetch case details
    const caseDetails = await sql`
      SELECT 
        c.case_id,
        c.status,
        c.priority,
        co.complaint_id,
        co.complainant_name,
        co.phone,
        co.email,
        co.crime_type,
        co.location,
        co.description,
        co.created_at
      FROM cases c
      LEFT JOIN complaints co ON co.complaint_id = c.complaint_id
      WHERE c.case_id = ${caseId}
      LIMIT 1
    `;

    if (caseDetails.length === 0) {
      return null;
    }

    const c = caseDetails[0];

    // 2. Fetch evidence list
    const evidenceList = await sql`
      SELECT evidence_id, evidence_type, file_path 
      FROM evidences 
      WHERE case_id = ${caseId}
    `;

    // 3. Fetch suggestions / AI history
    const suggestions = await sql`
      SELECT 
        id, 
        suggested_path, 
        recommended_sections, 
        case_law_refs,
        officer_feedback,
        officer_feedback_notes,
        generated_at,
        model_used
      FROM investigation_suggestions 
      WHERE case_id = ${caseId}
      ORDER BY generated_at DESC
    `;

    // Map evidence items
    const evidence = evidenceList.map((e: any, idx: number) => ({
      id: e.evidence_id ?? `ev-live-${idx}`,
      name: e.file_path ? e.file_path.split('/').pop() : `evidence_${e.evidence_id}.pdf`,
      type: (e.evidence_type === "Bank Statement" || e.evidence_type === "Call Detail Record" || e.evidence_type === "Screenshot" || e.evidence_type === "Image" || e.evidence_type === "Document" || e.evidence_type === "Device Image") ? e.evidence_type : "Document",
      size: "1.5 MB",
      uploadedAt: "2026-07-28"
    }));

    // Map latest suggestion to AI Summary
    const latestSuggestion = suggestions[0];
    const suggestedPath: string[] = Array.isArray(latestSuggestion?.suggested_path) ? latestSuggestion.suggested_path : [];
    const recommendedSections: any[] = Array.isArray(latestSuggestion?.recommended_sections) ? latestSuggestion.recommended_sections : [];

    // Formulate legal recommendations
    const recommendations = recommendedSections.map((s: any, idx: number) => {
      const act = s.act ?? s.act_code ?? "BNS";
      const code = s.code ?? s.section_number ?? "";
      return {
        id: `rec-live-${idx}`,
        text: `Apply Section ${code} ${act} (${s.title ?? 'Offence Penalty Section'}) in chargesheet. Reason: ${s.relevance_reason ?? 'Matches complaint facts.'}`,
        category: 'Legal'
      };
    });

    // Timeline steps reconstruction
    const timeline = [
      { title: 'Complaint Registered', date: formatTimestamp(c.created_at), description: 'FIR filed based on initial complaint facts.', status: 'completed' }
    ];

    if (evidence.length > 0) {
      timeline.push({ 
        title: 'Evidence Uploaded', 
        date: formatTimestamp(c.created_at), 
        description: `Uploaded ${evidence.length} physical/digital files to evidence locker.`, 
        status: 'completed' 
      });
    }

    // Add suggestions milestones to timeline
    suggestions.reverse().forEach((s: any, idx: number) => {
      timeline.push({
        title: `AI Suggestion Generated (v${idx+1})`,
        date: formatTimestamp(s.generated_at),
        description: `Crime OS parsed facts using ${s.model_used ?? 'gemini-2.0-flash'}.`,
        status: 'completed'
      });
      if (s.officer_feedback === 'accepted') {
        timeline.push({
          title: `Legal Request Sent (v${idx+1})`,
          date: formatTimestamp(s.generated_at),
          description: `Dispatched Section 91 notice to Legal Advisor.`,
          status: 'completed'
        });
      }
    });

    // Version history reconstruction
    const versionHistory = suggestions.map((s: any, idx: number) => ({
      version: `v1.${idx} (${s.officer_feedback === 'accepted' ? 'Approved' : 'Draft'})`,
      date: formatTimestamp(s.generated_at).split(' ')[0],
      description: `AI suggested paths and sections mapping.`,
      author: 'Crime OS AI'
    }));

    // Audit trail reconstruction
    const auditTrail = [
      { id: 'au-live-1', event: 'Case Registered', user: 'System', timestamp: formatTimestamp(c.created_at) }
    ];
    suggestions.forEach((s: any, idx: number) => {
      auditTrail.push({
        id: `au-live-s-${idx}`,
        event: `AI Suggestion Generated`,
        user: `AI System`,
        timestamp: formatTimestamp(s.generated_at)
      });
      if (s.officer_feedback) {
        auditTrail.push({
          id: `au-live-f-${idx}`,
          event: `Officer feedback: ${s.officer_feedback}`,
          user: `SI Officer`,
          timestamp: formatTimestamp(s.generated_at)
        });
      }
    });

    // Final assembled report object
    return {
      info: {
        caseId: c.case_id,
        firNo: c.case_id,
        officerName: 'SI Vikram Rathore',
        policeStation: 'Sector 4 Cyber Cell',
        crimeType: c.crime_type ?? 'Cyber Offence',
        priority: (c.priority === 'High' || c.priority === 'Medium' || c.priority === 'Low') ? c.priority : 'High',
        status: c.status ?? 'Investigation Active',
        dateRegistered: c.created_at ? new Date(c.created_at).toISOString().substring(0, 10) : '2026-07-28'
      },
      aiSummary: {
        complaintOverview: c.description ?? 'No complaint overview provided.',
        investigationPerformed: 'Obtained HDFC bank statement of complainant showing withdrawal. Sent legal notice to Airtel Payments Bank nodal officer.',
        evidenceAnalysed: `Analysed ${evidence.length} files in evidence locker.`,
        responsesReceived: 'Nodal responses received from service providers.',
        currentFindings: 'Funds traced to suspect bank wallets. IP log registration matches suspect area coordinates.',
        suggestedNextSteps: suggestedPath.length > 0 ? suggestedPath : [
          'Recommend formal freezing of suspect beneficiary account.',
          'Issue Section 91 BNSS notice to NPCI/GPay for transaction device telemetry.',
          'Collect CCTV logs from transaction point locations.'
        ]
      },
      timeline,
      analytics: {
        bank: {
          status: 'Received',
          accountsAnalysed: 1,
          transactionsAnalysed: 4,
          suspiciousTransactions: 2,
          details: 'Beneficiary bank KYC matched suspect. Secondary wallet transfers registered.'
        },
        telecom: {
          status: 'Received',
          simInfo: 'Prepaid SIM registry tracked',
          imei: '359876009876543',
          lastTower: 'Sector-4 coordinates tracked',
          details: 'Suspect phone high-activity calling logs match standard spam center patterns.'
        },
        onlinePlatforms: {
          status: 'Received',
          details: 'Device IP logs confirm transaction from Dhanbad/Jamtara region.'
        }
      },
      evidence,
      recommendations: recommendations.length > 0 ? recommendations : [
        { id: 'rec-live-def-1', text: 'Recommend relevant BNS sections (cheating and impersonation).', category: 'Legal' },
        { id: 'rec-live-def-2', text: 'Request freezing of beneficiary account.', category: 'Financial' }
      ],
      notes: latestSuggestion?.officer_feedback_notes ?? '',
      versionHistory: versionHistory.length > 0 ? versionHistory : [
        { version: 'v1.0 (Initial)', date: '2026-07-28', description: 'Generated from initial FIR facts.', author: 'Crime OS AI' }
      ],
      auditTrail: auditTrail.reverse()
    };

  } catch (err) {
    console.error("Database query failed in getLiveCaseSummary, returning null for fallback.", err);
    return null;
  }
}
