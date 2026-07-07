export default function Navbar() {
  return (
    <header className="h-16 bg-white shadow flex justify-between items-center px-8">
      <h2 className="text-xl font-semibold">
        Dashboard
      </h2>

      <div className="flex gap-4 items-center">
        <div className="w-10 h-10 rounded-full bg-blue-500"></div>

        <div>
          <p className="font-semibold">
            Officer
          </p>

          <p className="text-sm text-gray-500">
            Police Department
          </p>
        </div>
      </div>
    </header>
  );
}