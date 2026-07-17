interface Props {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function NavigationButtons({ currentStep, totalSteps, onBack, onNext, onSubmit }: Props) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gold-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onBack}
        disabled={currentStep === 1}
        className="rounded-full border border-gold-200 bg-white px-5 py-3 text-base font-medium text-ink-900 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Back
      </button>

      <div className="flex gap-3">
        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={onNext}
            className="rounded-full bg-maroon-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-maroon-800"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            className="rounded-full bg-gold-600 px-5 py-3 text-base font-semibold text-maroon-900 transition hover:bg-gold-700"
          >
            Submit complaint
          </button>
        )}
      </div>
    </div>
  );
}