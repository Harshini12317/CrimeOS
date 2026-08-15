interface Props {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function NavigationButtons({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
}: Props) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gold-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      
      {/* BACK BUTTON */}
      <button
        type="button"
        onClick={onBack}
        disabled={
          currentStep === 1 ||
          isSubmitting
        }
        className="rounded-full border border-gold-200 bg-white px-5 py-3 text-base font-medium text-ink-900 transition disabled:cursor-not-allowed disabled:opacity-40"
      >
        Back
      </button>


      <div className="flex gap-3">
        
        {/* CONTINUE BUTTON */}
        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={onNext}
            disabled={isSubmitting}
            className="rounded-full bg-maroon-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-maroon-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        ) : (

          /* SUBMIT BUTTON */
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="flex min-w-[190px] items-center justify-center gap-2 rounded-full bg-gold-600 px-5 py-3 text-base font-semibold text-maroon-900 transition hover:bg-gold-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {isSubmitting ? (
              <>
                {/* Spinner */}
                <span
                  className="h-5 w-5 animate-spin rounded-full border-2 border-maroon-900/30 border-t-maroon-900"
                  aria-hidden="true"
                />

                <span>
                  Submitting...
                </span>
              </>
            ) : (
              <span>
                Submit complaint
              </span>
            )}

          </button>
        )}

      </div>
    </div>
  );
}