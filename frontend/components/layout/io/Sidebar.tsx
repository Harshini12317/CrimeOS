"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  FaHome,
  FaClipboardList,
  FaLightbulb,
  FaBook,
  FaShieldAlt,
  FaChevronRight,
} from "react-icons/fa";

const menu = [
  {
    title: "Dashboard",
    description: "Investigation overview",
    href: "/dashboard/io",
    icon: <FaHome />,
  },

  {
    title: "My Cases",
    description: "Assigned investigations",
    href: "/cases",
    matchPrefixes: [
      "/cases",
      "/investigation/cases",
    ],
    icon: <FaClipboardList />,
  },

  {
    title: "AI Assistant",
    description: "Investigation tools",
    href: "/ai-assistant",
    matchPrefixes: [
      "/ai-assistant",
      "/investigation/ai-assistant",
    ],
    icon: <FaLightbulb />,
  },

  {
    title: "Case Summary",
    description: "Investigation reports",
    href: "/case-summary",
    matchPrefixes: [
      "/case-summary",
    ],
    icon: <FaBook />,
  },
];

export default function IOSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="
        sticky
        top-0
        z-40
        flex
        h-screen
        w-64
        shrink-0
        flex-col
        overflow-y-auto
        bg-maroon-800
        text-ivory
      "
    >
      {/* =====================================================
          BRAND / HEADER
      ===================================================== */}
      <div className="border-b border-maroon-700 px-5 py-5">

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-gold-400
              text-maroon-900
              shadow-sm
            "
          >
            <FaShieldAlt className="text-lg" />
          </div>

          <div>
            <h1 className="font-display text-base font-bold tracking-wide">
              Investigation
            </h1>

            <p className="mt-0.5 text-[10px] uppercase tracking-widest text-gold-300">
              Police Case System
            </p>
          </div>

        </div>

        {/* Role Badge */}
        <div
          className="
            mt-5
            rounded-lg
            border
            border-gold-500/20
            bg-maroon-900/40
            px-3
            py-2.5
          "
        >
          <p className="text-[9px] font-semibold uppercase tracking-widest text-gold-400">
            Logged in as
          </p>

          <p className="mt-0.5 text-sm font-semibold text-ivory">
            Investigation Officer
          </p>
        </div>

      </div>


      {/* =====================================================
          NAVIGATION
      ===================================================== */}
      <div className="flex-1 px-3 py-5">

        <p
          className="
            mb-3
            px-3
            text-[10px]
            font-bold
            uppercase
            tracking-[0.18em]
            text-gold-400
          "
        >
          Investigation
        </p>

        <nav className="space-y-1.5">

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
                  group
                  relative
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  px-3
                  py-3
                  transition-all
                  duration-200

                  ${
                    active
                      ? `
                        bg-maroon-900
                        text-gold-300
                        shadow-sm
                      `
                      : `
                        text-ivory/75
                        hover:bg-maroon-700
                        hover:text-gold-200
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
                      top-2
                      h-8
                      w-1
                      rounded-r-full
                      bg-gold-400
                    "
                  />
                )}

                {/* Icon */}
                <span
                  className={`
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    transition-all

                    ${
                      active
                        ? `
                          bg-gold-400/10
                          text-gold-400
                        `
                        : `
                          bg-maroon-700/60
                          text-ivory/60
                          group-hover:bg-maroon-600
                          group-hover:text-gold-300
                        `
                    }
                  `}
                >
                  {item.icon}
                </span>


                {/* Text */}
                <div className="min-w-0 flex-1">

                  <p
                    className={`
                      text-sm
                      ${
                        active
                          ? "font-bold"
                          : "font-medium"
                      }
                    `}
                  >
                    {item.title}
                  </p>

                  <p
                    className={`
                      mt-0.5
                      truncate
                      text-[10px]
                      ${
                        active
                          ? "text-gold-300/70"
                          : "text-ivory/45"
                      }
                    `}
                  >
                    {item.description}
                  </p>

                </div>


                {/* Arrow */}
                <FaChevronRight
                  className={`
                    h-3
                    w-3
                    transition-all
                    ${
                      active
                        ? "text-gold-400"
                        : "text-ivory/20 group-hover:translate-x-0.5 group-hover:text-gold-300"
                    }
                  `}
                />

              </Link>
            );
          })}

        </nav>


        {/* =====================================================
            WORKSPACE INFO
        ===================================================== */}
        <div
          className="
            mt-8
            rounded-lg
            border
            border-gold-500/15
            bg-maroon-900/30
            p-4
          "
        >

          <div className="flex items-center gap-2">

            <div
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-400
                shadow-[0_0_6px_rgba(52,211,153,0.5)]
              "
            />

            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Investigation Workspace
            </span>

          </div>

          <p className="mt-2 text-[10px] leading-relaxed text-ivory/45">
            Access is limited to cases assigned to your officer account.
          </p>

        </div>

      </div>


      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div className="border-t border-maroon-700 px-5 py-4">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-[9px] uppercase tracking-widest text-ivory/40">
              Secure System
            </p>

            <p className="mt-0.5 text-[10px] text-ivory/60">
              Investigation Portal
            </p>
          </div>

          <FaShieldAlt className="text-sm text-gold-500/60" />

        </div>

      </div>

    </aside>
  );
}