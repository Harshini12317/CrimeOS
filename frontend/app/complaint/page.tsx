"use client";

import ComplaintWizard from "@/components/complaint/ComplaintWizard";
import SHOSidebar from "@/components/layout/sho/Sidebar";
import DashboardLayout from "../dashboard/layout";

export default function RegisterComplaintPage() {
  return (
    <DashboardLayout>
      {/* 1. We changed bg-slate-50 to bg-ivory to match the dashboard's exact background color */}
      <div className="flex bg-ivory min-h-[calc(100vh-73px)]">
        
        {/* SHO Sidebar Menu */}
        <SHOSidebar />

        {/* 2. We wrap the wizard in a max-w-4xl centered container to make it compact and elegant */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <ComplaintWizard />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}