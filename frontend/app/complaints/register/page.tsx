"use client";

import ComplaintWizard from "@/components/complaint/ComplaintWizard";
import SHOSidebar from "@/components/layout/sho/Sidebar";
import DashboardLayout from "../../dashboard/layout";

export default function RegisterComplaintPage() {
  return (
    <DashboardLayout>
      {/* 1. bg-ivory background matching the dashboard */}
      <div className="flex bg-ivory min-h-[calc(100vh-73px)]">
        
        {/* SHO Sidebar Menu */}
        <SHOSidebar />

        {/* 2. Changed to max-w-7xl to perfectly align the card width with the other dashboard pages! */}
        <main className="flex-1 p-8 max-w-7xl mx-auto overflow-y-auto">
          <ComplaintWizard />
        </main>
      </div>
    </DashboardLayout>
  );
}