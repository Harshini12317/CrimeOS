import Sidebar from "@/components/layout/io/Sidebar";

export default function IOLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex flex-1 flex-col">

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}