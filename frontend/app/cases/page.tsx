"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Filter, ShieldAlert, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";

// Import Auth to detect the logged-in user
import { useAuth } from "../providers/AuthProvider";

// Import BOTH Sidebars
import IOSidebar from "../../components/layout/io/Sidebar";
import SHOSidebar from "../../components/layout/sho/Sidebar";
import DashboardLayout from "../dashboard/layout";

const MOCK_CASES = [
  {
    case_number: "FIR-2026-041",
    fir_date: "2026-06-14",
    complainant_name: "Ananya Patel",
    category: "Cyber Crime",
    crime_type: "UPI / Net-banking Fraud",
    status: "Investigation Active",
    priority: "High",
    assigned_officer: "SI Vikram Rathore", // Professional generic name
  },
  {
    case_number: "FIR-2026-042",
    fir_date: "2026-06-13",
    complainant_name: "Rahul Sharma",
    category: "Conventional",
    crime_type: "Theft",
    status: "Pending Approvals",
    priority: "Medium",
    assigned_officer: "SI Amit Kumar",
  },
  {
    case_number: "FIR-2026-039",
    fir_date: "2026-06-10",
    complainant_name: "Vikram Singh",
    category: "Cyber Crime",
    crime_type: "Phishing / Fake Links",
    status: "Awaiting Service Provider",
    priority: "High",
    assigned_officer: "Unassigned", // Can be assigned!
  },
];

export default function UnifiedCasesPage() {
  const { user } = useAuth(); // Grab the logged-in user
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const isSHO = user?.role === "SHO"; // Check if they are the boss

  useEffect(() => {
    async function fetchCases() {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
        const response = await fetch(`${API_BASE}/v1/cases/`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setCases(data);
      } catch (err) {
        setCases(MOCK_CASES);
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const filteredCases = cases.filter((c) => {
    const caseNum = c.case_number || c.fir_no || c.case_id || "";
    const complainant = c.complainant_name || c.complainant || "";
    const crime_category = c.crime_category || c.type || "";
    return (
      caseNum.toLowerCase().includes(search.toLowerCase()) ||
      complainant.toLowerCase().includes(search.toLowerCase()) ||
      crime_category.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-73px)]">
        
        {/* DYNAMIC SIDEBAR SWITCHER */}
        {isSHO ? <SHOSidebar /> : <IOSidebar />}

        {/* RIGHT CONTENT WORKSPACE */}
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 max-w-5xl mx-auto space-y-8">
              {/* Page Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-2xl text-ink-900">
                    {isSHO ? "Station Case Overview" : "My Assigned Cases"}
                  </h1>
                  <p className="mt-1 text-ink-600">
                    {isSHO 
                      ? "Monitor all ongoing active investigations across your station house." 
                      : "Manage your active investigations, review AI suggestions, and track legal requests."}
                  </p>
                </div>
              </div>

              {/* Toolbar: Search and Filters */}
              <div className="flex items-center justify-between rounded-lg border border-gold-200 bg-white p-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-600" />
                  <input
                    type="text"
                    placeholder="Search by FIR number, complainant..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gold-200 rounded-md text-sm text-ink-900 focus:outline-none focus:border-maroon-600"
                  />
                </div>
                <button className="rounded-md border border-gold-300 px-4 py-2 text-sm text-ink-900 hover:bg-gold-50 transition-colors flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>

              {/* Cases Data Table Section */}
              <section className="rounded-lg border border-gold-200 bg-white p-5">
                <h2 className="font-medium text-ink-900 mb-4">Active Investigations</h2>
                
                {loading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 text-maroon-600 animate-spin mr-2" />
                    <span className="text-sm text-ink-600">Loading cases...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-ink-900">
                      <thead className="border-b border-gold-200 text-ink-600">
                        <tr>
                          <th className="pb-3 font-medium">FIR Number</th>
                          <th className="pb-3 font-medium">Date Filed</th>
                          <th className="pb-3 font-medium">Complainant</th>
                          <th className="pb-3 font-medium">Crime Type</th>
                          {isSHO && <th className="pb-3 font-medium">Assigned Officer</th>}
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold-100">
                        {filteredCases.length > 0 ? (
                          filteredCases.map((c) => {
                            const displayId = c.case_number || c.fir_no || c.case_id;
                            const displayDate = c.fir_date || c.created_at || c.date;
                            const displayComplainant = c.complainant_name || c.complainant || "Unknown";
                            const displayType = c.crime_type || c.type || "General Case";
                            const displayCategory = c.category || "Unassigned";

                            return (
                              <tr key={displayId} className="hover:bg-gold-50/30 transition">
                                <td className="py-3 font-medium text-ink-900">{displayId}</td>
                                <td className="py-3 text-ink-600">{displayDate}</td>
                                <td className="py-3 text-ink-800">{displayComplainant}</td>
                                <td className="py-3">
                                  <div>
                                    <p className="text-ink-900 font-medium">{displayType}</p>
                                    <p className="text-xs text-ink-600">{displayCategory}</p>
                                  </div>
                                </td>
                                {isSHO && (
                                  <td className="py-3 text-ink-900 font-medium">
                                    {c.assigned_officer === "Unassigned" ? (
                                      <Link
                                        href="/assign-case"
                                        className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 hover:underline"
                                      >
                                        <UserPlus className="h-4 w-4" />
                                        Assign IO
                                      </Link>
                                    ) : (
                                      c.assigned_officer
                                    )}
                                  </td>
                                )}
                                <td className="py-3">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                      c.status === "Investigation Active"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : c.status === "Pending Approvals"
                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                        : "bg-blue-50 text-blue-800 border-blue-200"
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <Link
                                    href={`/cases/${displayId}`}
                                    className="text-maroon-600 hover:text-maroon-800 hover:underline font-medium"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-ink-600">
                              <div className="flex flex-col items-center justify-center">
                                <ShieldAlert className="h-8 w-8 text-gold-300 mb-2" />
                                <p className="font-medium text-ink-900">No cases found</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}