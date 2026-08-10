"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import { 
  MOCK_CASE_SUMMARIES,
  MOCK_CASE_LIST,
  type CaseSummaryReport,
  type CaseListItem,
  type EvidenceItem,
  type Recommendation,
  type LegalSectionRef,
  type CaseLawReference
} from "@/lib/mockData";
import { getLiveCaseIds, getLiveCaseList, getLiveCaseSummary } from "@/lib/dbActions";
import { 
  Shield, 
  Printer, 
  FileText, 
  MapPin, 
  User, 
  Calendar, 
  Activity, 
  AlertCircle,
  TrendingUp,
  FileDigit,
  Paperclip,
  CheckSquare,
  Clock,
  History,
  CheckCircle,
  Building,
  Phone,
  Globe,
  Save,
  Scale,
  Gavel,
  ListChecks
} from "lucide-react";

function CaseSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Available case IDs state (defaults to mock keys, gets updated by DB on mount)
  const [caseIds, setCaseIds] = useState<string[]>(Object.keys(MOCK_CASE_SUMMARIES));
  
  // Determine starting case ID
  const urlCaseId = searchParams.get("caseId");
  const initialCaseId = urlCaseId && caseIds.includes(urlCaseId) ? urlCaseId : caseIds[0];
  
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [report, setReport] = useState<CaseSummaryReport | null>(null);
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [completedRecommendations, setCompletedRecommendations] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // 1. Fetch live case list on mount
  useEffect(() => {
    async function loadCaseIds() {
      try {
        const liveIds = await getLiveCaseIds();
        if (liveIds && liveIds.length > 0) {
          setCaseIds(liveIds);
          // If url caseId isn't loaded or isn't in DB, select the first live case ID
          if (urlCaseId && liveIds.includes(urlCaseId)) {
            setSelectedCaseId(urlCaseId);
          } else {
            setSelectedCaseId(liveIds[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch live case IDs, using mock keys fallback.", err);
      }
    }
    loadCaseIds();
  }, [urlCaseId]);

  // 2. Fetch report details when selectedCaseId changes
  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        // Query the live Postgres database via Server Action
        const liveReport = await getLiveCaseSummary(selectedCaseId);
        if (liveReport) {
          setReport(liveReport);
          const savedNotes = localStorage.getItem(`crimeos_notes_${selectedCaseId}`);
          setNotes(savedNotes ?? liveReport.notes ?? "");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to fetch live case summary from DB. Falling back to mock data.", err);
      }
      
      // Fallback to MOCK_CASE_SUMMARIES if DB fails or returns empty
      const selectedReport = MOCK_CASE_SUMMARIES[selectedCaseId];
      if (selectedReport) {
        setReport(selectedReport);
        const savedNotes = localStorage.getItem(`crimeos_notes_${selectedCaseId}`);
        setNotes(savedNotes ?? selectedReport.notes);
      }
      setLoading(false);
    }
    loadReport();
  }, [selectedCaseId]);

  // Handle URL updates when switching cases
  const handleCaseChange = (caseId: string) => {
    setSelectedCaseId(caseId);
    router.push(`/case-summary?caseId=${caseId}`);
  };

  // Save notes locally
  const handleSaveNotes = () => {
    localStorage.setItem(`crimeos_notes_${selectedCaseId}`, notes);
    setSaveStatus("Notes saved successfully!");
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Toggle checklist recommendation state
  const toggleRecommendation = (id: string) => {
    setCompletedRecommendations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Activity className="h-8 w-8 text-maroon-600 animate-spin" />
        <p className="text-ink-600 text-sm">Compiling Case Summary Report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-6">
      
      {/* Top Selector Banner (Hide in Print Mode) */}
      <div className="bg-white border border-gold-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink-900 uppercase tracking-wider">Select Investigation Case:</span>
          <select
            value={selectedCaseId}
            onChange={(e) => handleCaseChange(e.target.value)}
            className="bg-ivory border border-gold-300 text-ink-900 text-sm font-mono font-bold rounded-md px-3 py-1.5 focus:outline-none focus:border-maroon-600 cursor-pointer"
          >
            {caseIds.map((id) => (
              <option key={id} value={id}>
                {id} {MOCK_CASE_SUMMARIES[id] ? `(${MOCK_CASE_SUMMARIES[id].info.crime_category})` : ""}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-maroon-800 text-ivory px-4 py-2 text-sm font-medium rounded-md shadow-sm hover:bg-maroon-700 transition duration-150"
        >
          <Printer className="h-4 w-4" /> Print Final Report
        </button>
      </div>

      {/* Official Watermark & Header Block for Professional Police Report */}
      <div className="text-center pb-6 border-b border-gold-300 relative print:border-b-2 print:border-ink-900">
        <div className="flex justify-center mb-2">
          <Shield className="h-14 w-14 text-maroon-800 print:text-ink-900" />
        </div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-maroon-900 print:text-ink-900">
          State Police Cyber Crime Division
        </h1>
        <p className="text-xs text-ink-600 font-semibold tracking-wider uppercase mt-1">
          Confidential Investigation Report // For Official Use Only
        </p>
        <span className="absolute right-0 bottom-1 font-mono text-[10px] text-ink-600">
          Ref ID: {report.info.caseId}-SUM
        </span>
      </div>

      {/* 1. Case Information Grid */}
      <section className="bg-white border border-gold-200 rounded-lg p-6 space-y-4 print:border-0 print:p-0">
        <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-2 flex items-center gap-2 print:text-ink-900">
          <FileText className="h-5 w-5" /> 1. Case Information
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {[
            { label: "Case ID", value: report.info.caseId, icon: <FileDigit className="h-4 w-4 text-gold-600 print:hidden" />, mono: true },
            { label: "FIR Number", value: report.info.firNo, icon: <Shield className="h-4 w-4 text-gold-600 print:hidden" />, mono: true },
            { label: "Assigned Officer", value: report.info.officerName, icon: <User className="h-4 w-4 text-gold-600 print:hidden" /> },
            { label: "Police Station", value: report.info.policeStation, icon: <MapPin className="h-4 w-4 text-gold-600 print:hidden" /> },
            { label: "Crime Type", value: report.info.crime_category, icon: <Activity className="h-4 w-4 text-gold-600 print:hidden" /> },
            { label: "Priority Level", value: report.info.priority, icon: <AlertCircle className="h-4 w-4 text-gold-600 print:hidden" />, highlight: true },
            { label: "Current Status", value: report.info.status, icon: <TrendingUp className="h-4 w-4 text-gold-600 print:hidden" /> },
            { label: "Date Registered", value: report.info.dateRegistered, icon: <Calendar className="h-4 w-4 text-gold-600 print:hidden" />, mono: true }
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-xs text-ink-600 uppercase font-semibold flex items-center gap-1">
                {item.icon} {item.label}
              </span>
              <p className={`font-medium text-ink-900 ${
                item.mono ? 'font-mono text-xs' : ''
              } ${
                item.highlight && report.info.priority === 'High' ? 'text-risk font-bold' : ''
              }`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. AI Generated Summary Card */}
      <section className="bg-white border border-gold-200 rounded-lg p-6 space-y-4 print:border-0 print:p-0">
        <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-2 flex items-center gap-2 print:text-ink-900">
          <Activity className="h-5 w-5 text-maroon-700 print:hidden" /> 2. AI Generated Summary
        </h2>
        
        <div className="bg-gold-50/20 border-l-4 border-l-gold-500 p-5 rounded-r-lg space-y-4 print:bg-white print:p-0 print:border-l-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm leading-relaxed">
            
            <div className="space-y-2">
              <h3 className="font-semibold text-ink-900 border-b border-gold-100 pb-1">Complaint Overview</h3>
              <p className="text-ink-600 text-xs">{report.aiSummary.complaintOverview}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-ink-900 border-b border-gold-100 pb-1">Investigation Performed</h3>
              <p className="text-ink-600 text-xs">{report.aiSummary.investigationPerformed}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-ink-900 border-b border-gold-100 pb-1">Evidence Analysed</h3>
              <p className="text-ink-600 text-xs">{report.aiSummary.evidenceAnalysed}</p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-ink-900 border-b border-gold-100 pb-1">Responses Received</h3>
              <p className="text-ink-600 text-xs">{report.aiSummary.responsesReceived}</p>
            </div>

          </div>

          <div className="space-y-2 pt-2 text-sm leading-relaxed">
            <h3 className="font-semibold text-ink-900 border-b border-gold-100 pb-1">Current Findings</h3>
            <p className="text-ink-600 text-xs">{report.aiSummary.currentFindings}</p>
          </div>

          <div className="space-y-2 pt-2 text-sm">
            <h3 className="font-semibold text-ink-900">Suggested Next Steps</h3>
            <ul className="list-disc pl-5 text-xs text-ink-600 space-y-1">
              {report.aiSummary.suggestedNextSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-1">
        
        {/* Left column: Timeline & Response Analytics */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 3. Investigation Timeline */}
          <section className="bg-white border border-gold-200 rounded-lg p-6 space-y-4 print:border-0 print:p-0">
            <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-2 flex items-center gap-2 print:text-ink-900">
              <Clock className="h-5 w-5 text-maroon-700 print:hidden" /> 3. Investigation Timeline
            </h2>
            
            <div className="relative pl-6 border-l-2 border-gold-200 ml-4 space-y-6">
              {report.timeline.map((step, i) => (
                <div key={i} className="relative">
                  <span className={`absolute -left-9 top-0.5 rounded-full p-1 border bg-white ${
                    step.status === 'completed' 
                      ? 'border-emerald-500 text-emerald-600' 
                      : step.status === 'overdue'
                      ? 'border-risk text-risk'
                      : 'border-gold-300 text-gold-500'
                  }`}>
                    <CheckCircle className="h-3 w-3" />
                  </span>
                  
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-ink-900">{step.title}</span>
                      <span className="text-ink-600 font-mono font-normal">{step.date}</span>
                    </div>
                    <p className="text-xs text-ink-600 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. Response Analytics */}
          <section className="bg-white border border-gold-200 rounded-lg p-6 space-y-4 print:border-0 print:p-0">
            <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-2 flex items-center gap-2 print:text-ink-900">
              <Activity className="h-5 w-5 text-maroon-700 print:hidden" /> 4. Response Analytics
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Bank Card */}
              <div className="border border-gold-100 rounded-lg p-4 space-y-3 bg-ivory/30">
                <div className="flex justify-between items-center border-b border-gold-100 pb-2">
                  <span className="text-xs font-bold text-ink-900 flex items-center gap-1">
                    <Building className="h-4 w-4 text-maroon-600" /> Bank Response
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    report.analytics.bank.status === 'Received'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {report.analytics.bank.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-ink-600">
                  <div className="flex justify-between">
                    <span>Accounts Analysed:</span>
                    <span className="font-bold text-ink-900 font-mono">{report.analytics.bank.accountsAnalysed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transactions Traced:</span>
                    <span className="font-bold text-ink-900 font-mono">{report.analytics.bank.transactionsAnalysed}</span>
                  </div>
                  <div className="flex justify-between text-risk font-semibold">
                    <span>Suspicious Trx Flags:</span>
                    <span className="font-bold font-mono">{report.analytics.bank.suspiciousTransactions}</span>
                  </div>
                  <p className="text-[10px] italic border-t border-gold-100/50 pt-2 text-ink-600 leading-snug">
                    {report.analytics.bank.details}
                  </p>
                </div>
              </div>

              {/* Telecom Card */}
              <div className="border border-gold-100 rounded-lg p-4 space-y-3 bg-ivory/30">
                <div className="flex justify-between items-center border-b border-gold-100 pb-2">
                  <span className="text-xs font-bold text-ink-900 flex items-center gap-1">
                    <Phone className="h-4 w-4 text-maroon-600" /> Telecom Response
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    report.analytics.telecom.status === 'Received'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {report.analytics.telecom.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-ink-600">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-semibold">SIM Registry:</span>
                    <span className="font-bold text-ink-900 truncate">{report.analytics.telecom.simInfo}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-semibold">IMEI Mapped:</span>
                    <span className="font-bold text-ink-900 font-mono text-[11px]">{report.analytics.telecom.imei}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-semibold">Last Cell Tower:</span>
                    <span className="font-bold text-ink-950 text-[10px]">{report.analytics.telecom.lastTower}</span>
                  </div>
                  <p className="text-[10px] italic border-t border-gold-100/50 pt-2 text-ink-600 leading-snug">
                    {report.analytics.telecom.details}
                  </p>
                </div>
              </div>

              {/* Online Platforms */}
              <div className="border border-gold-100 rounded-lg p-4 space-y-3 bg-ivory/30">
                <div className="flex justify-between items-center border-b border-gold-100 pb-2">
                  <span className="text-xs font-bold text-ink-900 flex items-center gap-1">
                    <Globe className="h-4 w-4 text-maroon-600" /> Online Platforms
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    report.analytics.onlinePlatforms.status === 'Received'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {report.analytics.onlinePlatforms.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-ink-600">
                  <p className="text-xs text-ink-600">
                    Nodal officer requests sent for connection log registry, device identification details, and messaging records.
                  </p>
                  <p className="text-[10px] italic border-t border-gold-100/50 pt-2 text-ink-600 leading-snug">
                    {report.analytics.onlinePlatforms.details}
                  </p>
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* Right column: Evidence, Recommendations */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* 5. Evidence Locker */}
          <section className="bg-white border border-gold-200 rounded-lg p-6 space-y-4 print:border-0 print:p-0">
            <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-2 flex items-center gap-2 print:text-ink-900">
              <Paperclip className="h-5 w-5 text-maroon-700 print:hidden" /> 5. Evidence Locker
            </h2>
            
            <div className="space-y-2">
              {report.evidence.length > 0 ? (
                report.evidence.map((item: EvidenceItem) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between border border-gold-100 p-2.5 rounded bg-ivory/20 hover:bg-gold-50/20 transition duration-150"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-maroon-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink-900 truncate">{item.name}</p>
                        <span className="text-[10px] text-ink-600 uppercase font-semibold">{item.type}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono font-bold text-ink-900">{item.size}</p>
                      <span className="text-[9px] text-ink-600 font-mono">{item.uploadedAt}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-600 py-3 text-center">No evidence files registered.</p>
              )}
            </div>
          </section>

          {/* 6. AI Recommendations */}
          <section className="bg-white border border-gold-200 rounded-lg p-6 space-y-4 print:border-0 print:p-0">
            <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-2 flex items-center gap-2 print:text-ink-900">
              <CheckSquare className="h-5 w-5 text-maroon-700 print:hidden" /> 6. AI Recommendations
            </h2>
            
            <div className="space-y-3">
              {report.recommendations.map((rec: Recommendation) => (
                <div 
                  key={rec.id} 
                  onClick={() => toggleRecommendation(rec.id)}
                  className={`flex items-start gap-2.5 border border-gold-100 p-3 rounded cursor-pointer transition select-none ${
                    completedRecommendations[rec.id] 
                      ? 'bg-emerald-50/20 border-emerald-300 opacity-70' 
                      : 'bg-white hover:bg-gold-50/10'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!completedRecommendations[rec.id]}
                    readOnly
                    className="mt-0.5 h-3.5 w-3.5 border-gold-300 rounded text-maroon-600 focus:ring-maroon-500 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      rec.category === 'Legal' 
                        ? 'bg-purple-100 text-purple-800'
                        : rec.category === 'Financial'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rec.category}
                    </span>
                    <p className={`text-xs text-ink-600 ${
                      completedRecommendations[rec.id] ? 'line-through text-ink-600/70' : ''
                    }`}>
                      {rec.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* 7. Officer Notes Section (Hide in Print Mode if Empty) */}
      <section className="bg-white border border-gold-200 rounded-lg p-6 space-y-4 print:border-0 print:p-0">
        <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-2 flex items-center gap-2 print:text-ink-900">
          <FileText className="h-5 w-5 text-maroon-700 print:hidden" /> 7. Officer Case Notes
        </h2>
        
        <div className="space-y-3 print:hidden">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Input updates, suspects interviewed, panchnama copies, or physical check details for this case..."
            rows={4}
            className="w-full border border-gold-300 rounded-lg p-3 text-xs focus:outline-none focus:border-maroon-600 font-sans leading-relaxed text-ink-900 bg-ivory/10"
          />
          <div className="flex justify-between items-center">
            <button
              onClick={handleSaveNotes}
              className="inline-flex items-center gap-2 bg-gold-600 text-white font-medium px-4 py-2 text-xs rounded hover:bg-gold-700 transition duration-150"
            >
              <Save className="h-3.5 w-3.5" /> Save Officer Notes
            </button>
            {saveStatus && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
                {saveStatus}
              </span>
            )}
          </div>
        </div>

        {/* Printable View of Notes */}
        <div className="hidden print:block text-xs leading-relaxed text-ink-900 italic border border-ink-900 p-4 rounded-md">
          {notes ? notes : "No officer notes entered for this case."}
        </div>
      </section>

      {/* Footer Details: 8. Version History & 9. Audit Trail (Grid Side by Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gold-300 pt-6">
        
        {/* 8. Version History */}
        <section className="space-y-3">
          <h2 className="font-display text-base font-bold text-maroon-900 flex items-center gap-2 print:text-ink-900">
            <History className="h-4 w-4 text-maroon-700 print:hidden" /> 8. Report Version History
          </h2>
          <div className="space-y-2">
            {report.versionHistory.map((ver, i) => (
              <div key={i} className="border border-gold-100 p-3 rounded bg-white text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-ink-900 font-mono">{ver.version}</span>
                  <span className="text-[10px] text-ink-600 font-mono">{ver.date}</span>
                </div>
                <p className="text-ink-600 text-[11px] leading-snug">{ver.description}</p>
                <div className="text-[9px] text-ink-600 mt-1 font-semibold">Author: {ver.author}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. Audit Trail */}
        <section className="space-y-3">
          <h2 className="font-display text-base font-bold text-maroon-900 flex items-center gap-2 print:text-ink-900">
            <Clock className="h-4 w-4 text-maroon-700 print:hidden" /> 9. Case Audit Trail
          </h2>
          <div className="border border-gold-100 rounded-lg p-3 bg-white divide-y divide-gold-50">
            {report.auditTrail.map((log) => (
              <div key={log.id} className="py-2 first:pt-0 last:pb-0 text-xs flex justify-between items-start">
                <div>
                  <p className="font-bold text-ink-900 text-[11px]">{log.event}</p>
                  <span className="text-[10px] text-ink-600">Actor: {log.user}</span>
                </div>
                <span className="text-[10px] font-mono text-ink-600 font-semibold">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

    </div>
  );
}

export default function CaseSummaryPage() {
  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-73px)]">
        <Sidebar />
        <main className="flex-1 p-8 bg-ivory print:p-0 print:bg-white">
          <div className="max-w-5xl mx-auto">
            <Suspense fallback={
              <div className="flex items-center justify-center h-96">
                <p className="text-ink-600">Loading Case Summary Page...</p>
              </div>
            }>
              <CaseSummaryContent />
            </Suspense>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}