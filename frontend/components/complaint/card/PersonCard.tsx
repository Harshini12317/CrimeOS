interface PersonCardProps {
  name: string;
  role: string;
  description: string;
}

export default function PersonCard({ name, role, description }: PersonCardProps) {
  return (
    <div className="rounded-xl border border-gold-200 bg-ivory p-4">
      <p className="font-semibold text-maroon-800">{name}</p>
      <p className="mt-1 text-sm font-medium text-gold-700">{role}</p>
      <p className="mt-2 text-sm text-ink-600">{description}</p>
    </div>
  );
}