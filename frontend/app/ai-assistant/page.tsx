import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import AiAssistantClient from "@/components/legal/Aiassistantclient";

export default function AiAssistantPage() {
  return (
    <DashboardLayout>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <AiAssistantClient />
        </main>
      </div>
    </DashboardLayout>
  );
}