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
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCompleted ? "bg-blue-600 text-white" : isActive ? "bg-slate-900 text-white" : "bg-gray-300 text-slate-700"}`}>
              {index + 1}
            </div>
            <p className={`mt-2 text-sm font-medium ${isCompleted || isActive ? "text-slate-900" : "text-slate-500"}`}>{step}</p>
          </div>
        );
      })}
    </div>
  );
}