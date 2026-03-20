"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  activeRoute: string;
  children: ReactNode;
};

const navigationItems = [
  { href: "/today", label: "Today" },
  { href: "/study/srs", label: "SRS" },
  { href: "/study/input", label: "Input" },
  { href: "/study/speak", label: "Speak" },
  { href: "/inbox", label: "Inbox" },
  { href: "/tutor", label: "Tutor" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" }
];

const leftMenuItems = ["Sales Board", "Address Info", "Record Document", "Today", "SRS", "Input", "Speak", "Inbox", "Tutor", "Progress", "Settings"];

const functionsByRoute: Record<string, string[]> = {
  "/today": ["Start standard day", "Switch to 5+5+5", "Mark block complete", "Review recycle tasks", "Open tutor prep"],
  "/study/srs": ["Show answer", "Grade recall", "Promote from inbox", "Limit new cards", "Mark SRS done"],
  "/study/input": ["Capture phrase", "Open current text", "Move to speak", "Save quick note", "Mark input done"],
  "/study/speak": ["Start recording", "Replay locally", "Save self-check", "Generate AI prompt", "Generate AI feedback"],
  "/inbox": ["Capture phrase", "Promote to SRS", "Mark spoken", "Review recycle", "Open Today"],
  "/tutor": ["Session prep", "Save notes", "Promote correction", "Open inbox", "Open SRS"],
  "/progress": ["View weekly trend", "Review snapshots", "Open Today", "Check backlog", "Open settings"],
  "/settings": ["Save defaults", "Adjust caps", "Check AI status", "Open Today", "Review offline mode"]
};

export function AppShell({ title, activeRoute, children }: AppShellProps) {
  const pathname = usePathname();
  const functions = functionsByRoute[activeRoute] ?? functionsByRoute["/today"];

  return (
    <div className="min-h-screen bg-applus-shell text-applus-text">
      <header className="border-b border-applus-border bg-white">
        <div className="h-2 w-full bg-applus-blue" />
        <div className="flex min-h-14 items-center gap-3 px-3 sm:px-4 lg:px-6">
          <div className="flex h-12 w-20 items-center justify-center rounded-br-[28px] rounded-tl-[28px] bg-applus-accent text-sm font-semibold text-white">ap+</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Classic</p>
            <div className="flex items-center gap-2 text-lg font-medium">
              <span>Spanish</span>
              <span className="text-slate-400">›</span>
              <span>{title}</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <div className="rounded border border-applus-blue bg-blue-50 px-3 py-1 text-sm font-medium text-applus-blue">12 / 200</div>
            <button className="rounded border border-applus-border px-3 py-1 text-sm text-applus-text" type="button">
              Sorting A-Z
            </button>
            <button className="rounded border border-applus-border px-3 py-1 text-sm text-applus-text" type="button">
              Documentation
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_200px]">
        <aside className="hidden border-r border-applus-border bg-white lg:block">
          <div className="border-b border-applus-border px-4 py-4">
            <h2 className="text-sm font-semibold text-applus-text">Sales</h2>
          </div>
          <div className="px-2 py-3">
            <input
              aria-label="Search menu"
              className="w-full rounded border border-applus-border px-3 py-2 text-sm"
              placeholder="Search"
              type="text"
            />
          </div>
          <nav aria-label="Main navigation" className="px-2 py-1">
            <ul className="space-y-1">
              {leftMenuItems.map((item) => {
                const mappedHref = navigationItems.find((entry) => entry.label === item)?.href;
                const isActive = mappedHref ? pathname === mappedHref : false;
                const content = (
                  <span className={`block rounded px-3 py-2 text-sm ${isActive ? "border border-applus-blue bg-blue-50 font-medium" : "hover:bg-applus-muted"}`}>{item}</span>
                );

                return (
                  <li key={item}>
                    {mappedHref ? (
                      <Link href={mappedHref}>{content}</Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main className="bg-[linear-gradient(180deg,rgba(10,112,235,0.12)_0%,rgba(244,247,251,1)_18%,rgba(244,247,251,1)_100%)] p-3 sm:p-4 lg:p-5">
          <div className="mb-4 hidden rounded border border-applus-border bg-white px-4 py-3 shadow-panel lg:block">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto text-xs text-applus-text">
                {["1 angelegt", "2 bereit zur Freigabe", "3 freigegeben", "4 bestatigt", "5 versendet", "6 geliefert", "7 fakturiert", "8 storniert", "9 Muster"].map((step) => (
                  <div className="min-w-max" key={step}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {children}
        </main>

        <aside className="hidden border-l border-applus-border bg-white lg:block">
          <div className="border-b border-applus-border px-4 py-4">
            <h2 className="text-sm font-semibold text-applus-text">Functions</h2>
          </div>
          <nav aria-label="Functions" className="px-3 py-3">
            <ul className="space-y-2 text-sm text-applus-text">
              {functions.map((item, index) => (
                <li key={item}>
                  <span className={`block rounded px-3 py-2 ${index === 0 ? "border-l-2 border-applus-blue bg-blue-50 font-medium" : "hover:bg-applus-muted"}`}>{item}</span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-applus-border bg-white px-2 py-2 lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                className={`rounded px-2 py-2 text-center text-[11px] font-medium ${isActive ? "bg-blue-50 text-applus-blue" : "bg-applus-muted text-applus-text"}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
