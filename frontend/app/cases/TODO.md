# Add this button into cases

const [activeCaseId, setActiveCaseId] = useState<string | null>(null);

// inside each case row:
<button onClick={() => setActiveCaseId(caseItem.case_id)}>
  Legal Suggestion
</button>

// at the bottom of the case list component:
{activeCaseId && (
  <LegalSuggestionModal
    caseId={activeCaseId}
    onClose={() => setActiveCaseId(null)}
  />
)}