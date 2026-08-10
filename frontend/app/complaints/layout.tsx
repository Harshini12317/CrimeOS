import Sidebar from "@/components/layout/sho/Sidebar";

export default function ComplaintsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-ivory">
      {/* SHO SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-gold-200 bg-maroon-900">
        <Sidebar />
      </aside>

      {/* MAIN CONTENT */}
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}