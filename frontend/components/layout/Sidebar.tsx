"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaClipboardList,
  FaHistory,
  FaChartBar,
  FaMapMarkedAlt,
  FaCog,
} from "react-icons/fa";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <FaHome />,
  },
  {
    title: "Register Complaint",
    href: "/complaint",
    icon: <FaClipboardList />,
  },
  {
    title: "Complaint History",
    href: "/complaints/history",
    icon: <FaHistory />,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: <FaChartBar />,
  },
  {
    title: "Heatmap",
    href: "/heatmap",
    icon: <FaMapMarkedAlt />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <FaCog />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-maroon-800 text-ivory min-h-screen p-5 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ivory">
          CrimeOS
        </h1>
        <div className="h-px bg-gold-500/60 mt-4" />
      </div>

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