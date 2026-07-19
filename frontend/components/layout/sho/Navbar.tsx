export default function Navbar() {
  return (
    <header className="h-16 bg-ivory border-b border-gold-200 shadow-sm flex justify-between items-center px-8">
      <h2 className="text-xl font-display font-semibold text-maroon-800">
        Dashboard
      </h2>

      <div className="flex gap-4 items-center">
        <div className="w-10 h-10 rounded-full bg-maroon-700 ring-2 ring-gold-500"></div>

        <div>
          <p className="font-semibold text-ink-900">
            Officer
          </p>

          <p className="text-sm text-ink-600">
            Police Department
          </p>
        </div>
      </div>
    </header>
  );
}