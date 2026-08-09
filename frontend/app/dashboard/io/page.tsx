"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  Archive, 
  ArrowRight,
  Plus,
  ArrowUpRight,
  Activity,
  Building,
  Mail,
  Phone,
  FileText
} from "lucide-react";
import { 
  MOCK_STATS, 
  MOCK_ACTIVITIES, 
  MOCK_PENDING_ACTIONS, 
  MOCK_CASES_TABLE 
} from "@/lib/mockData";
import { getLiveDashboardData } from "@/lib/dbActions";

export default function IODashboard() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);
  const [pendingActions, setPendingActions] = useState(MOCK_PENDING_ACTIONS);
  const [cases, setCases] = useState(MOCK_CASES_TABLE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch live database values using Next.js Server Action
        const liveData = await getLiveDashboardData();
        if (liveData) {
          setStats(liveData.stats);
          setCases(liveData.recentCases);
          setActivities(liveData.activities);
        }
      } catch (err) {
        console.warn("Failed to fetch live cases from database. Falling back to mock data.", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Map Activity Events to Icons
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "Complaint Uploaded":
        return <Plus className="h-4 w-4 text-emerald-600" />;
      case "AI Investigation Path Generated":
        return <Activity className="h-4 w-4 text-purple-600" />;
      case "Legal Request Sent":
        return <Mail className="h-4 w-4 text-blue-600" />;
      case "Bank Response Received":
        return <Building className="h-4 w-4 text-amber-600" />;
      case "Telecom Response Received":
        return <Phone className="h-4 w-4 text-teal-600" />;
      case "Case Summary Updated":
        return <FileCheck className="h-4 w-4 text-indigo-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-ivory min-h-screen">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-maroon-900">Investigating Officer Home</h1>
        <p className="mt-1 text-sm text-ink-600">
          Manage your ongoing investigations, track telecom/bank responses, and review AI suggestions.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {[
          { label: "Active Cases", value: stats.activeCases, icon: <FolderKanban className="h-5 w-5 text-maroon-600" />, color: "border-maroon-200" },
          { label: "Pending Legal Requests", value: stats.pendingLegalRequests, icon: <Clock className="h-5 w-5 text-gold-600" />, color: "border-gold-300" },
          { label: "Responses Received", value: stats.responsesReceived, icon: <FileCheck className="h-5 w-5 text-emerald-600" />, color: "border-emerald-200" },
          { label: "AI Alerts", value: stats.aiAlerts, icon: <AlertTriangle className="h-5 w-5 text-risk" />, color: "border-maroon-100 bg-maroon-50/20", alert: true },
          { label: "Closed Cases", value: stats.closedCases, icon: <Archive className="h-5 w-5 text-ink-600" />, color: "border-gold-200" }
        ].map((kpi, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-lg border p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${kpi.color}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold text-ink-600 uppercase tracking-wider">{kpi.label}</span>
              {kpi.icon}
            </div>
            <div className={`font-display text-3xl font-bold ${kpi.alert ? 'text-risk' : 'text-ink-900'}`}>
              {loading ? "..." : kpi.value}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Activities & Pending Actions */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Pending Actions Section */}
          <section className="bg-white rounded-lg border border-gold-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gold-100 pb-3">
              <h2 className="font-display text-lg font-bold text-maroon-900">Pending Actions</h2>
              <span className="bg-risk/10 text-risk text-xs font-semibold px-2 py-0.5 rounded">Urgent</span>
            </div>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div 
                  key={action.id} 
                  className={`border-l-4 p-3 rounded bg-ivory/50 flex flex-col space-y-1 transition duration-150 hover:bg-gold-50/30 ${
                    action.priority === "high" ? "border-l-risk" : "border-l-gold-500"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-ink-900">{action.type}</span>
                    <span className="font-mono text-[10px] text-ink-600 uppercase bg-white border px-1.5 py-0.2 rounded">
                      {action.caseId}
                    </span>
                  </div>
                  <p className="text-xs text-ink-600 line-clamp-2">{action.details}</p>
                  <span className="text-[10px] text-risk/80 font-medium pt-1">Due Date: {action.dueDate}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity Section */}
          <section className="bg-white rounded-lg border border-gold-200 p-5 space-y-4">
            <h2 className="font-display text-lg font-bold text-maroon-900 border-b border-gold-100 pb-3">
              Investigation Activity
            </h2>
            <div className="relative pl-4 border-l border-gold-200 space-y-6">
              {activities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Circle Indicator */}
                  <span className="absolute -left-7 top-0.5 bg-white border border-gold-200 rounded-full p-1 shadow-xs transition duration-200 group-hover:border-maroon-500">
                    {getActivityIcon(act.type)}
                  </span>
                  <div className="flex flex-col space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-ink-900 leading-tight">{act.type}</span>
                      <span className="text-[10px] text-ink-600 font-mono whitespace-nowrap ml-2">{act.timestamp}</span>
                    </div>
                    <span className="text-[10px] font-mono text-maroon-700 font-medium">Case: {act.caseId}</span>
                    <p className="text-xs text-ink-600">{act.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Recent Cases Table & Quick Actions */}
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Cases Section */}
          <section className="bg-white rounded-lg border border-gold-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-gold-100 pb-3">
              <h2 className="font-display text-lg font-bold text-maroon-900">Recent Cases</h2>
              <Link href="/cases" className="text-xs text-maroon-600 hover:text-maroon-800 hover:underline flex items-center gap-1 font-semibold">
                View All Cases <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gold-200 text-ink-600 font-medium text-xs uppercase tracking-wider">
                    <th className="pb-2">Case ID</th>
                    <th className="pb-2">Crime Type</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-100 text-ink-900">
                  {cases.map((c) => (
                    <tr key={c.caseId} className="hover:bg-gold-50/20 transition duration-100">
                      <td className="py-3 font-mono font-bold text-xs">
                        <Link href={`/cases/${c.caseId}`} className="text-maroon-600 hover:text-maroon-800 hover:underline">
                          {c.caseId}
                        </Link>
                      </td>
                      <td className="py-3 text-xs font-medium">{c.crime_category}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                          c.status === "Investigation Active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : c.status === "Pending Approvals"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-xs font-mono text-ink-600">{c.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Quick Actions Grid */}
          <section className="space-y-4">
            <h2 className="font-display text-lg font-bold text-maroon-900">Quick Operations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "My Cases", desc: "List and manage all complaints assigned to your officer account.", route: "/cases", bg: "border-maroon-100 hover:bg-maroon-50/10" },
                { title: "Legal Requests", desc: "View drafts and statuses of Section 91 BNSS notices dispatched.", route: "/investigation/legal-requests", bg: "border-gold-200 hover:bg-gold-50/20" },
                { title: "AI Assistant", desc: "Perform OCR, transcript translations, and SOP checks.", route: "/ai-assistant", bg: "border-purple-200 hover:bg-purple-50/10" },
                { title: "Case Summary", desc: "Review the final investigation logs and compile reports.", route: "/case-summary", bg: "border-emerald-200 hover:bg-emerald-50/10" }
              ].map((act, i) => (
                <Link 
                  key={i} 
                  href={act.route}
                  className={`bg-white p-5 rounded-lg border shadow-xs transition duration-200 hover:shadow hover:-translate-y-0.5 flex flex-col justify-between group ${act.bg}`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-display font-bold text-ink-900 text-sm group-hover:text-maroon-600 transition duration-150">
                        {act.title}
                      </h3>
                      <ArrowUpRight className="h-4 w-4 text-ink-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition duration-150" />
                    </div>
                    <p className="text-xs text-ink-600 leading-relaxed">{act.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}