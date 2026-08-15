import DashboardLayout from "@/app/dashboard/layout";
import Sidebar from "@/components/layout/legal/Sidebar";

export default function LegalAdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div className="flex">
        <div className="sticky top-0 h-screen overflow-y-auto">
                <Sidebar />
                </div>
        <div className="flex-1">{children}</div>
      </div>
    </DashboardLayout>
  );
}