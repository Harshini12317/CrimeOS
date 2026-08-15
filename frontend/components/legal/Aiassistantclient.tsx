"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Search, Sparkles, FileText, Scale, Shield, ArrowRight } from "lucide-react";

interface CaseSummary {
  case_id: string;
  case_number?: string;
  complaint_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  current_stage?: string;
}

export default function AiAssistantClient() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadCases() {
      try {
        const API_BASE =
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
        const token = localStorage.getItem("token");

        const response = await axios.get(`${API_BASE}/api/cases/my-cases`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });

        const fetchedCases: CaseSummary[] = response.data.cases || response.data || [];
        setCases(fetchedCases);

        // Auto-select first case if available
        if (fetchedCases.length > 0) {
          setSelectedCase(fetchedCases[0]);
        }
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  const filteredCases = cases.filter((item) => {
    const q = search.toLowerCase().trim();
    return (
      q === "" ||
      item.title?.toLowerCase().includes(q) ||
      item.case_number?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-[calc(100vh-80px)] w-full overflow-hidden bg-slate-50">
      {/* LEFT PANEL: Case Selector List */}
      <div className="w-1/3 min-w-[340px] max-w-[420px] border-r border-amber-200/60 bg-white flex flex-col">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif font-bold text-slate-900 tracking-wide text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-maroon-700" />
              MY CASES
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredCases.length}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search case #, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-maroon-700"
            />
          </div>
        </div>

        {/* Case Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="p-4 text-xs text-slate-500">Loading cases...</div>
          ) : filteredCases.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 text-center">No cases found</div>
          ) : (
            filteredCases.map((item) => {
              const isSelected = selectedCase?.case_id === item.case_id;
              const priorityClass =
                item.priority === "High"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : item.priority === "Medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200";

              return (
                <div
                  key={item.case_id}
                  onClick={() => setSelectedCase(item)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-maroon-800 bg-maroon-50/20 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800">
                      {item.case_number || "CMP-2026-000000"}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityClass}`}>
                      {item.priority || "LOW"}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1 mb-2">
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="rounded bg-amber-100/70 text-amber-800 px-1.5 py-0.5 uppercase font-medium text-[10px]">
                      {item.status || "OPEN"}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {item.current_stage || "Initial Inquiry"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: AI Assistant Dashboard for Selected Case */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {selectedCase ? (
          <>
            {/* Top Bar Header */}
            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-base font-bold text-slate-900">
                    {selectedCase.title}
                  </h1>
                  <span className="text-xs font-semibold text-slate-500">
                    {selectedCase.case_number}
                  </span>
                  <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] uppercase font-bold">
                    {selectedCase.status || "OPEN"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  AI Investigation WorkSpace & Legal Guidance Assistant
                </p>
              </div>

              {/* View Case Link */}
              <Link
                href={`/cases/${selectedCase.case_id}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                View Case Record
              </Link>
            </div>

            {/* AI Assistant Options Grid (3 Core AI Tools) */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Select Assistant Mode
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Evidence & Chargesheet Review */}
                <Link
                  href={`/investigation/ai-assistant/${selectedCase.case_id}/complaint-analysis?mode=evidence${selectedCase.complaint_id ? `&complaintId=${selectedCase.complaint_id}` : ""
                    }`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-maroon-700 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg bg-maroon-50 text-maroon-700 flex items-center justify-center mb-4 group-hover:bg-maroon-700 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-maroon-700 transition-colors">
                      Evidence Analysis
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Analyze statements, uploaded digital evidence, and inspect key timeline facts.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-semibold text-maroon-700">
                    Open Review <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Option 2: Legal & Statutory Act Guidance */}
                <Link
                  href={`/investigation/ai-assistant/${selectedCase.case_id}/legal-sections?mode=evidence${selectedCase.complaint_id ? `&complaintId=${selectedCase.complaint_id}` : ""
                    }`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-maroon-700 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                      <Scale className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-maroon-700 transition-colors">
                      BNS / BNSS Guidance
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Get exact statutory provisions, applicable BNS sections, and BNSS procedural rules.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-semibold text-amber-700">
                    Explore Acts <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Option 3: Investigation Action Steps Generator */}
                <Link
                  href={`/investigation/ai-assistant/${selectedCase.case_id}/investigation-sop?mode=evidence${selectedCase.complaint_id ? `&complaintId=${selectedCase.complaint_id}` : ""
                    }`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-maroon-700 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-4 group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-maroon-700 transition-colors">
                      AI Action Plan
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Generate automated investigation checklists, summon drafts, and recommended next steps.
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-semibold text-indigo-700">
                    Generate Steps <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400 text-sm">
            Select a case from the left panel to begin.
          </div>
        )}
      </div>
    </div>
  );
}