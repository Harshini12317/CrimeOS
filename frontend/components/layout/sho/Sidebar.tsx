"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaMapMarkedAlt,
  FaCog,
  FaWatchmanMonitoring,
  FaUserFriends,
} from "react-icons/fa";
import { Fa0, FaAnchorCircleCheck } from "react-icons/fa6";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard/sho",    // total complaints, active cases, pending assignments, closed cases
    icon: <FaHome />,
  },
  {
    title: "Register Complaints",
    href: "/complaints/register",    //complaint registration
    icon: <FaHome />,
  },
  {
    title: "Complaints",
    href: "/complaints",        // List of complaints
    icon: <FaClipboardList />,
  },
  
  {
    title: "Case Monitoring",
    href: "/cases",            // investigation progress, pending approvals, case timeline, officer workload
    icon: <FaWatchmanMonitoring />,
  },
  {
    title: "Reports",
    href: "/reports",           // crime statistics, monthly reports, officer performance
    icon: <FaChartBar />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-maroon-800 text-ivory min-h-screen p-5 flex flex-col">

      <nav className="space-y-1">
        {menu.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-md border-l-2 transition-colors ${
                active
                  ? "bg-maroon-700 border-gold-500 text-gold-300"
                  : "border-transparent text-ivory/80 hover:bg-maroon-700 hover:border-gold-500/50 hover:text-gold-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="text-sm font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}