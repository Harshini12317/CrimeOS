import Sidebar from "@/components/layout/sho/Sidebar";

export default function SHOLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      <Sidebar />

      <div className="ml-64 flex min-h-screen min-w-0 flex-col">
        <main className="min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}