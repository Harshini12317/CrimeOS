// components/investigation/GuidanceStepper.tsx
"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ChevronRight, ShieldCheck, Scale } from "lucide-react";

interface GuidanceStep {
  step_number: number;
  action: string;
  legal_basis?: string;
}

interface GuidanceStepperProps {
  caseId: string;
  steps: GuidanceStep[];
}

export default function GuidanceStepper({ caseId, steps }: GuidanceStepperProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // 1. Load persisted progress from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`investigation_sop_progress_${caseId}`);
      if (saved) {
        setCompletedSteps(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load SOP progress from localStorage", e);
    }
  }, [caseId]);

  // 2. Toggle completion and persist to localStorage
  const toggleComplete = (stepNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedSteps((prev) => {
      const updated = { ...prev, [stepNum]: !prev[stepNum] };
      try {
        localStorage.setItem(`investigation_sop_progress_${caseId}`, JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to save SOP progress", err);
      }
      return updated;
    });
  };

  if (!steps?.length) return null;

  const currentStep = steps[activeStep];
  const completedCount = Object.keys(completedSteps).filter((k) => completedSteps[Number(k)]).length;

  return (
    <div className="space-y-5">
      {/* Roadmap Header Card */}
      <div className="rounded-xl border border-gold-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-maroon-700" />
            <h3 className="font-semibold text-ink-900 text-sm">SOP Investigation Roadmap</h3>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gold-50 text-maroon-900 border border-gold-200">
            {completedCount} of {steps.length} Steps Completed
          </span>
        </div>

        {/* Step Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {steps.map((s, idx) => {
            const isDone = completedSteps[s.step_number];
            const isActive = idx === activeStep;
            return (
              <button
                key={s.step_number}
                onClick={() => setActiveStep(idx)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-all border ${
                  isActive
                    ? "border-maroon-700 bg-maroon-700 text-white shadow-sm"
                    : isDone
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-gold-200 bg-white text-ink-700 hover:bg-gold-50"
                }`}
              >
                <span className="truncate">Step {s.step_number}</span>
                {isDone ? (
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-emerald-600"}`} />
                ) : (
                  <Circle className={`h-4 w-4 shrink-0 ${isActive ? "text-maroon-200" : "text-ink-400"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Execution Stage Card */}
      <div className="rounded-xl border border-gold-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gold-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maroon-700 text-xs font-bold text-white">
              {currentStep.step_number}
            </span>
            <span className="font-semibold text-ink-900 text-sm">Active Execution Stage</span>
          </div>

          <button
            onClick={(e) => toggleComplete(currentStep.step_number, e)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              completedSteps[currentStep.step_number]
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                : "bg-white text-ink-700 border-gold-300 hover:bg-gold-50"
            }`}
          >
            <CheckCircle2 className={`h-4 w-4 ${completedSteps[currentStep.step_number] ? "text-emerald-600" : "text-ink-400"}`} />
            {completedSteps[currentStep.step_number] ? "Completed" : "Mark as Complete"}
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-ink-900 leading-relaxed font-medium">{currentStep.action}</p>

          {currentStep.legal_basis && (
            <div className="inline-flex items-center gap-2 rounded-lg bg-gold-50 px-3.5 py-2 border border-gold-200 text-xs text-ink-800">
              <Scale className="h-4 w-4 text-maroon-700 shrink-0" />
              <span>
                Statutory Authority: <strong className="font-semibold text-maroon-900">{currentStep.legal_basis}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-gold-100 bg-slate-50/30 px-6 py-3.5 flex items-center justify-between">
          <button
            onClick={() => setActiveStep((i) => Math.max(0, i - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 text-xs font-medium rounded-md border border-gold-300 bg-white text-ink-900 hover:bg-gold-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <span className="text-xs text-ink-500">
            Step {activeStep + 1} of {steps.length}
          </span>

          <button
            onClick={() => setActiveStep((i) => Math.min(steps.length - 1, i + 1))}
            disabled={activeStep === steps.length - 1}
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-medium rounded-md bg-maroon-600 text-white hover:bg-maroon-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}