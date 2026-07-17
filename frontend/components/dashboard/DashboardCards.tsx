type Props = {
  title: string;
  value: string;
  accent?: "default" | "risk";
};

export default function DashboardCard({
  title,
  value,
  accent = "default",
}: Props) {
  return (
    <div className="bg-white rounded-xl border-t-2 border-gold-500 shadow-sm p-6">
      <h3 className="text-sm font-medium text-ink-600 uppercase tracking-wide">
        {title}
      </h3>

      <p
        className={`text-3xl font-display font-semibold mt-2 ${
          accent === "risk" ? "text-risk" : "text-maroon-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}