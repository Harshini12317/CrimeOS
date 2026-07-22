"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaHome,
  FaClipboardList,
  FaLightbulb,
  FaBook,
  FaBalanceScaleRight,
} from "react-icons/fa";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard/io", // Assigned cases, pending tasks, requests awaiting response, recently updated cases
    icon: <FaHome />,
  },
  {
    title: "My Cases",
    href: "/cases",       // assigned complaints, case details, timeline, evidence, investigation notes
    icon: <FaClipboardList />,
  },
  {
    title: "Legal Requests",
    href: "/investigation/legal-requests", // generate requests drafts, sent requests, upload response, AI respose analysis
    icon: <FaBalanceScaleRight />,
  },
  {
    title: "AI assistant",
    href: "/ai-assistant", // Complaint Analysis (OCR/STT/Translation),Investigation SOP, Legal Section Suggestions
    icon: <FaLightbulb />,
  },
  {
    title: "Case summary",
    href: "/case-summary", // AI generated case summary, Audit trail, export report, request case closure
    icon: <FaBook />,
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