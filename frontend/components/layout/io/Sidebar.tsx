"use client";

import { match } from "assert";
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
    href: "/dashboard/io",
    icon: <FaHome />,
  },
  {
    title: "My Cases",
    href: "/cases",
    matchPrefixes: ["/cases", "/investigation/cases"],
    icon: <FaClipboardList />,
  },
  {
    title: "AI assistant",
    href: "/ai-assistant",
    // Match root route and sub-routes like /investigation/ai-assistant/...
    matchPrefixes: ["/ai-assistant", "/investigation/ai-assistant"],
    icon: <FaLightbulb />,
  },
  
  {
    title: "Case summary",
    href: "/case-summary",
    icon: <FaBook />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-maroon-800 text-ivory min-h-screen p-5 flex flex-col">
      <nav className="space-y-1">
        {menu.map((item) => {
          // Check if active via exact path or sub-route prefixes
          const active =
            pathname === item.href ||
            item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix));

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                active
                  ? "bg-maroon-900/60 border-l-4 border-gold-400 text-gold-300 font-bold shadow-sm"
                  : "border-l-4 border-transparent text-ivory/80 font-medium hover:bg-maroon-700 hover:border-gold-500/50 hover:text-gold-200"
              }`}
            >
              <span className={`text-base ${active ? "text-gold-400" : ""}`}>
                {item.icon}
              </span>
              <span className="text-sm">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}