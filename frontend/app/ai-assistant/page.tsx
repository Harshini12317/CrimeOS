import Sidebar from "@/components/layout/io/Sidebar";
import DashboardLayout from "@/app/dashboard/layout";
import AiAssistantClient from "@/components/legal/Aiassistantclient";

export default function AiAssistantPage() {
  return (
    <DashboardLayout>
      <div className="flex min-h-[calc(100vh-73px)] bg-ivory">
        <Sidebar />

        <main className="flex-1 min-w-0 p-6">
          <AiAssistantClient />
        </main>
      </div>
    </DashboardLayout>
  );
}