"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FaHome,
  FaClipboardList,
  FaPlusCircle,
  FaShieldAlt,
  FaCircle,
  FaUserTie,
  FaLock,
  FaChevronRight,
} from "react-icons/fa";

const menu = [
  {
    title: "Dashboard",
    description: "Station overview",
    href: "/dashboard/sho",
    icon: <FaHome />,
  },

  {
    title: "Register Complaint",
    description: "Create a new complaint",
    href: "/complaints/register",
    icon: <FaPlusCircle />,
  },

  {
    title: "Complaints",
    description: "View registered complaints",
    href: "/complaints",
    matchPrefixes: ["/complaints"],
    icon: <FaClipboardList />,
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
        flex
        h-screen
        w-64
        flex-col
        overflow-y-auto
        bg-maroon-800
        text-ivory
        shadow-xl
      "
    >
      {/* =====================================================
          BRAND / HEADER
      ===================================================== */}
      <div className="border-b border-maroon-700 px-5 py-6">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-gold-400/40
              bg-maroon-900
              text-gold-400
              shadow-sm
            "
          >
            <FaShieldAlt className="text-xl" />
          </div>

          <div className="min-w-0">
            <h1 className="font-display text-sm font-bold tracking-wide text-ivory">
              Police Investigation
            </h1>

            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-gold-300">
              Station System
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ROLE / USER CARD
      ===================================================== */}
      <div className="px-4 pt-5">
        <div
          className="
            rounded-xl
            border
            border-maroon-600
            bg-maroon-900/40
            p-4
          "
        >
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-gold-400
                text-maroon-900
              "
            >
              <FaUserTie className="text-sm" />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-ivory/50">
                Logged in as
              </p>

              <p className="mt-0.5 truncate text-sm font-bold text-ivory">
                Station House Officer
              </p>
            </div>
          </div>

          {/* Online status */}
          <div className="mt-3 flex items-center gap-2 border-t border-maroon-700 pt-3">
            <FaCircle className="text-[7px] text-emerald-400" />

            <span className="text-[10px] font-medium text-ivory/70">
              Station system active
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          NAVIGATION
      ===================================================== */}
      <nav className="flex-1 px-4 py-6">
        <div className="mb-3 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-300/70">
            Station Operations
          </p>
        </div>

        <div className="space-y-2">
          {menu.map((item) => {
            const active =
              pathname === item.href ||
              item.matchPrefixes?.some((prefix) => {
                // Don't make /complaints/register activate
                // the general Complaints item as well.
                if (
                  item.href === "/complaints" &&
                  pathname === "/complaints/register"
                ) {
                  return false;
                }

                return pathname.startsWith(prefix);
              });

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`
                  group
                  relative
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  px-3
                  py-3
                  transition-all
                  duration-200

                  ${
                    active
                      ? `
                        border-gold-400/30
                        bg-maroon-900/70
                        text-gold-300
                        shadow-sm
                      `
                      : `
                        border-transparent
                        text-ivory/75
                        hover:border-maroon-600
                        hover:bg-maroon-700
                        hover:text-ivory
                      `
                  }
                `}
              >
                {/* Active indicator */}
                {active && (
                  <span
                    className="
                      absolute
                      left-0
                      top-1/2
                      h-7
                      w-1
                      -translate-y-1/2
                      rounded-r-full
                      bg-gold-400
                    "
                  />
                )}

                {/* Icon */}
                <div
                  className={`
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    transition-colors

                    ${
                      active
                        ? "bg-gold-400/10 text-gold-400"
                        : "bg-maroon-900/30 text-ivory/60 group-hover:bg-maroon-900/50 group-hover:text-gold-300"
                    }
                  `}
                >
                  {item.icon}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className={`
                      text-sm font-semibold
                      ${
                        active
                          ? "text-gold-300"
                          : "text-ivory/90 group-hover:text-ivory"
                      }
                    `}
                  >
                    {item.title}
                  </p>

                  <p
                    className={`
                      mt-0.5 text-[10px]
                      ${
                        active
                          ? "text-ivory/60"
                          : "text-ivory/40 group-hover:text-ivory/60"
                      }
                    `}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Arrow */}
                <FaChevronRight
                  className={`
                    text-[9px]
                    transition-all
                    duration-200

                    ${
                      active
                        ? "translate-x-0 text-gold-400"
                        : "-translate-x-1 text-ivory/20 group-hover:translate-x-0 group-hover:text-ivory/50"
                    }
                  `}
                />
              </Link>
            );
          })}
        </div>

        {/* =====================================================
            QUICK INFORMATION
        ===================================================== */}
        <div className="mt-8">
          <div
            className="
              rounded-xl
              border
              border-gold-400/20
              bg-maroon-900/30
              p-4
            "
          >
            <div className="flex items-center gap-2">
              <FaLock className="text-xs text-gold-400" />

              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-300">
                Access Level
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-ivory/60">
              Station-level complaint registration, complaint review and
              case-summary access.
            </p>
          </div>
        </div>
      </nav>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div className="border-t border-maroon-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-ivory/40">
              Confidential
            </p>

            <p className="mt-1 text-[10px] text-ivory/50">
              Police Investigation System
            </p>
          </div>

          <FaShieldAlt className="text-sm text-gold-400/50" />
        </div>
      </div>
    </aside>
  );
}