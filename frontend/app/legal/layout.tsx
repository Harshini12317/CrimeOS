import DashboardLayout from "@/app/dashboard/layout";
import Sidebar from "@/components/layout/legal/Sidebar";

export default function LegalAdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </DashboardLayout>
  );
}