interface PersonCardProps {
  name: string;
  role: string;
  description: string;
}

export default function PersonCard({ name, role, description }: PersonCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-900">{name}</p>
      <p className="mt-1 text-base text-blue-600">{role}</p>
      <p className="mt-2 text-base text-slate-500">{description}</p>
    </div>
  );
}