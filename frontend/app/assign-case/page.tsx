"use client";

import { useState } from "react";
import { UserCheck, ShieldAlert, CheckCircle2, Briefcase } from "lucide-react";
import SHOSidebar from "../../components/layout/sho/Sidebar";
import DashboardLayout from "../dashboard/layout"; // 1. Imports the master header layout

export default function AssignCasePage() {
  const [selectedCase, setSelectedCase] = useState("FIR-2026-039");
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [success, setSuccess] = useState(false);

  const UNASSIGNED_CASES = [
    { id: "FIR-2026-039", complainant: "Vikram Singh", crime: "Phishing Fraud", date: "10 Jun 2026" },
    { id: "FIR-2026-045", complainant: "Meera Nair", crime: "Cyber Extortion", date: "12 Jun 2026" },
  ];

  const OFFICERS = [
    { id: "OFF-001", name: "SI Vikram Rathore", rank: "Sub-Inspector", active_cases: 2 },
    { id: "OFF-002", name: "SI Amit Kumar", rank: "Sub-Inspector", active_cases: 4 },
    { id: "OFF-003", name: "ASI Sneha Rao", rank: "Assistant Sub-Inspector", active_cases: 1 },
  ];

  function handleAssign() {
    if (!selectedOfficer) {
      alert("Please select an Investigating Officer.");
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 5000);
  }

  const activeCaseDetails = UNASSIGNED_CASES.find((c) => c.id === selectedCase);

  return (
    // 2. Wrap in the DashboardLayout to get the top Header
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        <SHOSidebar />

        {/* Right Main Content */}
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto">
            <div className="p-8 max-w-5xl mx-auto">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-2xl text-ink-900">Assign Investigating Officers</h1>
                  <p className="mt-1 text-ink-600">
                    Allocate unassigned complaints to active station officers securely.
                  </p>
                </div>
              </div>

              {/* Success Banner */}
              {success && (
                <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-ink-900">Case Allocated Successfully!</p>
                    <p className="text-sm text-ink-600">The assigned officer has been notified on their dashboard.</p>
                  </div>
                </div>
              )}

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {/* Left: Form */}
                <section className="sm:col-span-2 rounded-lg border border-gold-200 bg-white p-5 space-y-6">
                  {/* Step 1: Select Case */}
                  <div>
                    <h2 className="font-medium text-ink-900">1. Select Unassigned Complaint</h2>
                    <p className="mt-1 text-sm text-ink-600">Choose which pending FIR you'd like to allocate.</p>
                    <select
                      value={selectedCase}
                      onChange={(e) => {
                        setSelectedCase(e.target.value);
                        setSuccess(false);
                      }}
                      className="w-full mt-3 p-3 border border-gold-200 rounded-lg text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-ink-900/10"
                    >
                      {UNASSIGNED_CASES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} - {c.complainant}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Select Officer */}
                  <div>
                    <h2 className="font-medium text-ink-900">2. Select Investigating Officer (IO)</h2>
                    <p className="mt-1 text-sm text-ink-600">Pick the officer to take ownership of this case.</p>
                    <div className="space-y-3 mt-3">
                      {OFFICERS.map((off) => {
                        const active = selectedOfficer === off.id;
                        return (
                          <div
                            key={off.id}
                            onClick={() => {
                              setSelectedOfficer(off.id);
                              setSuccess(false);
                            }}
                            className={`p-4 border rounded-lg cursor-pointer transition flex items-center justify-between ${
                              active
                                ? "border-ink-900 bg-gold-50"
                                : "border-gold-200 hover:border-ink-300 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-full ${
                                  active ? "bg-ink-900 text-white" : "bg-gold-50 text-ink-600"
                                }`}
                              >
                                <Briefcase className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium text-ink-900 text-sm">{off.name}</p>
                                <p className="text-xs text-ink-600">
                                  {off.rank} · {off.active_cases} active cases
                                </p>
                              </div>
                            </div>
                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                                active ? "border-ink-900 bg-ink-900" : "border-gold-200"
                              }`}
                            >
                              {active && <span className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleAssign}
                    disabled={!selectedOfficer}
                    className="w-full bg-ink-900 hover:bg-ink-800 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserCheck className="h-5 w-5" />
                    Confirm Allocation
                  </button>
                </section>

                {/* Right: Live Case Summary */}
                <div className="space-y-4">
                  <section className="rounded-lg border border-gold-200 bg-white p-5 space-y-4">
                    <h2 className="font-medium text-ink-900">Active Case Details</h2>
                    {activeCaseDetails && (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-ink-600">FIR Number</p>
                          <p className="font-medium text-ink-900 text-sm">{activeCaseDetails.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-600">Complainant</p>
                          <p className="text-ink-900 text-sm">{activeCaseDetails.complainant}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-600">Crime Alleged</p>
                          <p className="text-ink-900 text-sm">{activeCaseDetails.crime}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-600">Date Logged</p>
                          <p className="text-ink-900 text-sm">{activeCaseDetails.date}</p>
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 space-y-2">
                    <div className="flex gap-2 text-amber-800 font-medium text-sm items-center">
                      <ShieldAlert className="h-5 w-5" />
                      Legal SOP Note
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Under BNSS Sec 173/176, allocating serious offences requires immediate forensic
                      videography and logging within 24 hours of assignment.
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}