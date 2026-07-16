interface Props {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function NavigationButtons({ currentStep, totalSteps, onBack, onNext, onSubmit }: Props) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 1}
        className="rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Back
      </button>

      <div className="flex gap-3">
        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-blue-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-full bg-emerald-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-emerald-700"
          >
            Submit complaint
          </button>
        )}
      </div>
    </div>
  );
}
