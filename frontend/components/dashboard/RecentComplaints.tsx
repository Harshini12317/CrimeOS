type ComplaintStatus = "pending" | "closed" | "high-risk";

type Complaint = {
  id: string;
  title: string;
  complainant: string;
  status: ComplaintStatus;
  date: string;
};

type Props = {
  complaints?: Complaint[];
};

// Sample data so the component renders something while the real complaints
// endpoint is wired up. Pass `complaints` from your API hook to replace this.
const fallback: Complaint[] = [
  { id: "FIR-2026-0142", title: "Theft reported at market road", complainant: "R. Patel", status: "pending", date: "17 Jul" },
  { id: "FIR-2026-0141", title: "Vehicle collision, minor injury", complainant: "S. Iyer", status: "closed", date: "17 Jul" },
  { id: "FIR-2026-0138", title: "Threat complaint, repeat offender", complainant: "M. Khan", status: "high-risk", date: "16 Jul" },
];

const statusStyles: Record<ComplaintStatus, string> = {
  pending: "bg-gold-100 text-gold-700 border-gold-300",
  closed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "high-risk": "bg-red-50 text-risk border-red-200",
};

const statusLabel: Record<ComplaintStatus, string> = {
  pending: "Pending",
  closed: "Closed",
  "high-risk": "High risk",
};

export default function RecentComplaints({ complaints = fallback }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink-600 uppercase tracking-wide">
          Recent complaints
        </h3>
        <a
          href="/complaints/history"
          className="text-xs font-medium text-maroon-700 hover:text-gold-600"
        >
          View all
        </a>
      </div>

      <div className="divide-y divide-gray-100">
        {complaints.map((c) => (
          <div key={c.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">{c.title}</p>
              <p className="text-xs text-ink-600 mt-0.5">
                <span className="font-mono">{c.id}</span> · {c.complainant} ·{" "}
                {c.date}
              </p>
            </div>

            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[c.status]}`}
            >
              {statusLabel[c.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}