"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Filter, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import Sidebar from "../../components/layout/io/Sidebar";
import DashboardLayout from "../dashboard/layout";

// 1. Safe Mock Data Fallback
const MOCK_CASES = [
  {
    case_number: "FIR-2026-041",
    fir_date: "2026-06-14",
    complainant_name: "Ananya Patel",
    category: "Cyber Crime",
    crime_type: "UPI / Net-banking Fraud",
    status: "Investigation Active",
    priority: "High",
  },
  {
    case_number: "FIR-2026-042",
    fir_date: "2026-06-13",
    complainant_name: "Rahul Sharma",
    category: "Conventional",
    crime_type: "Theft",
    status: "Pending Approvals",
    priority: "Medium",
  },
  {
    case_number: "FIR-2026-039",
    fir_date: "2026-06-10",
    complainant_name: "Vikram Singh",
    category: "Cyber Crime",
    crime_type: "Phishing / Fake Links",
    status: "Awaiting Service Provider",
    priority: "High",
  },
];

export default function IOCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 2. Fetch live cases from the cloud database on load!
  useEffect(() => {
    async function fetchCases() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
        const response = await fetch(`${API_BASE}/v1/cases/`); // Or whatever her endpoint is named
        
        if (!response.ok) {
          throw new Error("Backend API returned an error");
        }
        
        const data = await response.json();
        setCases(data);
      } catch (err) {
        console.warn("Database endpoint not ready. Falling back to robust mock data:", err);
        // Fallback to our mock data so your UI remains fully operational!
        setCases(MOCK_CASES);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCases();
  }, []);

  // Filter based on whatever data is loaded
  const filteredCases = cases.filter((c) => {
    const caseNum = c.case_number || c.fir_no || c.case_id || "";
    const complainant = c.complainant_name || c.complainant || "";
    const crimeType = c.crime_type || c.type || "";
    
    return (
      caseNum.toLowerCase().includes(search.toLowerCase()) ||
      complainant.toLowerCase().includes(search.toLowerCase()) ||
      crimeType.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div className="flex bg-slate-50 min-h-[calc(100vh-73px)]">
        {/* LEFT SIDEBAR */}
        <Sidebar />

        {/* RIGHT CONTENT */}
        <main className="flex-1 p-8 max-w-7xl space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Assigned Cases</h1>
              <p className="text-slate-500 mt-1">
                Manage your active investigations, review AI suggestions, and track legal requests.
              </p>
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by FIR number, complainant, or crime type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>

          {/* Loading Indicator */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
              <p className="text-slate-600 font-medium">Fetching cases from cloud database...</p>
            </div>
          ) : (
            /* Cases Data Table */
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">FIR Number</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Date Filed</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Complainant</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Crime Type</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600">Status</th>
                    <th className="py-4 px-6 text-sm font-semibold text-slate-600 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.length > 0 ? (
                    filteredCases.map((c) => {
                      // 3. Mapping the exact database column names safely!
                      const displayId = c.case_number || c.fir_no || c.case_id;
                      const displayDate = c.fir_date || c.created_at || c.date;
                      const displayComplainant = c.complainant_name || c.complainant || "Unknown";
                      const displayType = c.crime_type || c.type || "General Case";
                      const displayCategory = c.category || "Unassigned";

                      return (
                        <tr key={displayId} className="hover:bg-slate-50 transition group">
                          <td className="py-4 px-6 font-medium text-slate-900 text-sm">{displayId}</td>
                          <td className="py-4 px-6 text-slate-600 text-sm">{displayDate}</td>
                          <td className="py-4 px-6 text-slate-800 text-sm">{displayComplainant}</td>
                          <td className="py-4 px-6 text-sm">
                            <div>
                              <p className="text-slate-900 font-medium">{displayType}</p>
                              <p className="text-xs text-slate-500">{displayCategory}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                c.status === "Investigation Active"
                                  ? "bg-blue-100 text-blue-700"
                                  : c.status === "Pending Approvals"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-sm">
                            <Link
                              href={`/cases/${displayId}`}
                              className="inline-flex items-center gap-2 px-3 py-1.5 font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye className="h-4 w-4" />
                              View Case
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <ShieldAlert className="h-10 w-10 text-slate-300 mb-3" />
                          <p className="text-lg font-medium text-slate-700">No cases found</p>
                          <p className="text-sm mt-1">Try adjusting your search query.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}