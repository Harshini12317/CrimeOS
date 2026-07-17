import { Check } from "lucide-react";

interface Props {
  currentStep: number;
}

const steps = ["Documents", "Complaint", "Victims", "Suspects", "Complainant", "Review"];

export default function Stepper({ currentStep }: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:justify-between">
      {steps.map((step, index) => {
        const isActive = currentStep === index + 1;
        const isCompleted = currentStep > index + 1;

        return (
          <div key={index} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                isCompleted
                  ? "bg-gold-500 text-maroon-900"
                  : isActive
                  ? "bg-maroon-800 text-ivory ring-2 ring-gold-500 ring-offset-2"
                  : "border-2 border-gold-200 bg-white text-ink-600"
              }`}
            >
              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                isCompleted || isActive ? "text-maroon-800" : "text-ink-600"
              }`}
            >
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}