"use client";

import Link from "next/link";
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
    href: "#",
    icon: <FaHistory />,
  },
  {
    title: "Analytics",
    href: "#",
    icon: <FaChartBar />,
  },
  {
    title: "Heatmap",
    href: "#",
    icon: <FaMapMarkedAlt />,
  },
  {
    title: "Settings",
    href: "#",
    icon: <FaCog />,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-5">
      <h1 className="text-2xl font-bold mb-10">
        CrimeOS
      </h1>

      <nav className="space-y-3">
        {menu.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition"
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}