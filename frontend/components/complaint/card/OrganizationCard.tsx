interface OrganizationCardProps {
  name: string;
  type: string;
  summary: string;
}

export default function OrganizationCard({ name, type, summary }: OrganizationCardProps) {
  return (
    <div className="rounded-xl border border-gold-200 bg-ivory p-4">
      <p className="font-semibold text-maroon-800">{name}</p>
      <p className="mt-1 text-sm font-medium text-gold-700">{type}</p>
      <p className="mt-2 text-sm text-ink-600">{summary}</p>
    </div>
  );
}