import Sidebar from "@/components/layout/sho/Sidebar";

export default function SHOLayout({
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