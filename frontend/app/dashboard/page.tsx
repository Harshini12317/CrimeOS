import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import DashboardCard from "@/components/dashboard/DashboardCards";

export default function Dashboard() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-gray-100 min-h-screen">
        <Navbar />

        <div className="p-8">

          <div className="grid grid-cols-4 gap-6">

            <DashboardCard
              title="Today's Complaints"
              value="124"
            />

            <DashboardCard
              title="Pending"
              value="36"
            />

            <DashboardCard
              title="Closed"
              value="88"
            />

            <DashboardCard
              title="High Risk"
              value="12"
            />

          </div>

        </div>
      </main>
    </div>
  );
}