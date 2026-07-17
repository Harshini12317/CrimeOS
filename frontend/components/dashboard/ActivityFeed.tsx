type ActivityItem = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  caseId?: string;
};

type Props = {
  items?: ActivityItem[];
};

// Sample data so the component renders something while the real feed
// endpoint is wired up. Pass `items` from your API hook to replace this.
const fallback: ActivityItem[] = [
  { id: "1", actor: "Officer R. Shah", action: "registered a new complaint", timestamp: "10 min ago", caseId: "FIR-2026-0142" },
  { id: "2", actor: "Officer A. Mehta", action: "marked case as closed", timestamp: "42 min ago", caseId: "FIR-2026-0139" },
  { id: "3", actor: "System", action: "flagged a complaint as high risk", timestamp: "1 hr ago", caseId: "FIR-2026-0138" },
];

export default function ActivityFeed({ items = fallback }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-sm font-medium text-ink-600 uppercase tracking-wide mb-4">
        Recent activity
      </h3>

      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 mt-1" />
              {i < items.length - 1 && (
                <span className="w-px flex-1 bg-gold-200" />
              )}
            </div>

            <div className="pb-2">
              <p className="text-sm text-ink-900">
                <span className="font-semibold">{item.actor}</span>{" "}
                {item.action}
                {item.caseId && (
                  <span className="ml-1 font-mono text-xs text-maroon-700">
                    {item.caseId}
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-600 mt-0.5">{item.timestamp}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}