"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaClipboardList,
} from "react-icons/fa";
import { FaBookBookmark, FaMagnifyingGlass } from "react-icons/fa6";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard/legal-advisor", // Pending Reviews, Approved Requests, Notifications
    icon: <FaHome />,
  },
  {
    title: "Cases Review",
    href: "/legal/cases",       // complaint details, investigation notes, evidence, timeline 
    icon: <FaClipboardList />,
  },
  {
    title: "Legal Review",
    href: "/legal/legal-review", // verify AI suggested sections, review legal requests, add legal opinions, final clearance
    icon: <FaMagnifyingGlass />,
  },
  {
    title: "Legal Library",
    href: "/legal/legal-library", // search BNS/BNSS/BSA sections and case law
    icon: <FaBookBookmark />,
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