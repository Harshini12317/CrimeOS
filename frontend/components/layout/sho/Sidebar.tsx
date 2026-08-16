"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaBook,
  FaWatchmanMonitoring,
} from "react-icons/fa";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard/sho",
    icon: <FaHome />,
  },

  {
    title: "Register Complaints",
    href: "/complaints/register",
    icon: <FaClipboardList />,
  },

  {
    title: "Complaints",
    href: "/complaints",
    matchPrefixes: [
      "/complaints",
    ],
    icon: <FaClipboardList />,
  },

  {
    title: "All Cases",
    href: "/cases",
    matchPrefixes: [
      "/cases",
      "/investigation/cases",
    ],
    icon: <FaWatchmanMonitoring />,
  },

  {
    title: "Case Summary",
    href: "/case-summary",
    icon: <FaBook />,
  },
];

export default function SHOSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        fixed
        left-0
        top-0
        z-40
        h-screen
        w-64
        overflow-y-auto
        bg-maroon-800
        p-5
        text-ivory
      "
    >
      <nav className="space-y-1">

        {menu.map((item) => {

          const active =
            pathname === item.href ||
            item.matchPrefixes?.some(
              (prefix) =>
                pathname.startsWith(prefix)
            );

          return (
            <Link
              key={item.title}
              href={item.href}
              className={`
                flex
                items-center
                gap-3
                rounded-md
                border-l-4
                p-3
                transition-colors

                ${
                  active
                    ? `
                      border-gold-400
                      bg-maroon-900/60
                      font-bold
                      text-gold-300
                      shadow-sm
                    `
                    : `
                      border-transparent
                      font-medium
                      text-ivory/80
                      hover:border-gold-500/50
                      hover:bg-maroon-700
                      hover:text-gold-200
                    `
                }
              `}
            >
              <span
                className={`
                  text-base
                  ${
                    active
                      ? "text-gold-400"
                      : ""
                  }
                `}
              >
                {item.icon}
              </span>

              <span className="text-sm">
                {item.title}
              </span>
            </Link>
          );
        })}

      </nav>
    </aside>
  );
}