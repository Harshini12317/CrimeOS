// components/investigation/GuidanceStepper.tsx
"use client";

import { useState } from "react";

interface GuidanceStep {
  step_number: number;
  action: string;
  legal_basis?: string;
}

interface GuidanceStepperProps {
  steps: GuidanceStep[];
}

export default function GuidanceStepper({ steps }: GuidanceStepperProps) {
  const [index, setIndex] = useState(0);

  if (!steps?.length) return null;

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <div className="rounded-lg border border-gold-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink-900">
          Step {step.step_number} of {steps.length}
        </h3>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${
                i === index ? "bg-maroon-600" : "bg-gold-200"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-900">{step.action}</p>

      {step.legal_basis && (
        <p className="mt-2 text-xs text-ink-600">
          Legal basis: <span className="font-medium">{step.legal_basis}</span>
        </p>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="rounded-md border border-gold-300 px-4 py-2 text-sm text-ink-900
                     hover:bg-gold-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          disabled={isLast}
          className="rounded-md bg-maroon-600 px-4 py-2 text-sm font-medium text-white
                     hover:bg-maroon-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}