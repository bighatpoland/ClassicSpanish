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
  { href: "/today", label: "Today", menuLabel: "Item Text" },
  { href: "/study/srs", label: "SRS", menuLabel: "Item Text" },
  { href: "/study/input", label: "Input", menuLabel: "Item Text" },
  { href: "/study/speak", label: "Speak", menuLabel: "Item Text" },
  { href: "/inbox", label: "Inbox", menuLabel: "Item Text" },
  { href: "/tutor", label: "Tutor", menuLabel: "Item Text" },
  { href: "/progress", label: "Progress", menuLabel: "Item Text" },
  { href: "/settings", label: "Settings", menuLabel: "Item Text" }
];

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

const toolbarButtons = ["|<", "<", ">", ">|", "+", "S", "D", "P", "@", "[]"];

export function AppShell({ title, activeRoute, children }: AppShellProps) {
  const pathname = usePathname();
  const functions = functionsByRoute[activeRoute] ?? functionsByRoute["/today"];

  return (
    <div className="min-h-screen bg-applus-shell text-applus-text">
      <header className="border-b border-applus-border bg-white shadow-[0_1px_0_rgba(255,255,255,0.7)]">
        <div className="h-2 w-full bg-applus-blue" />
        <div className="flex min-h-14 items-center gap-3 px-3 sm:px-4 lg:px-6">
          <div className="flex h-12 w-20 items-center justify-center rounded-br-[26px] bg-applus-accent text-lg font-semibold text-white shadow-inner">ap+</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">Classic</p>
            <div className="flex items-center gap-2 text-[28px] font-medium leading-none">
              <span className="text-[26px]">Spanish</span>
              <span className="text-slate-400">›</span>
              <span className="text-[26px]">{title}</span>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button className="border border-applus-blue bg-blue-50 px-3 py-1 text-sm font-medium text-applus-blue" type="button">
              + Ask Elly
            </button>
            <button className="border border-applus-border p-2 text-sm text-slate-500" type="button">
              ⚙
            </button>
            <div className="flex items-center gap-2 border-l border-applus-border pl-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-applus-blue">S</div>
              <div className="text-right text-sm">
                <div className="font-medium">Sophie Anna</div>
                <div className="text-applus-blue">AP_AG</div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden border-t border-applus-border bg-white px-4 py-2 lg:flex lg:items-center lg:gap-3">
          <div className="flex items-center gap-2">
            <div className="border border-applus-blue bg-blue-50 px-3 py-1 text-sm font-medium text-applus-blue">12 / 200</div>
            {toolbarButtons.map((label) => (
              <button className="flex h-8 w-8 items-center justify-center border border-transparent text-xs font-semibold text-slate-600 hover:border-applus-border hover:bg-applus-muted" key={label} type="button">
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="border border-applus-border px-3 py-1 text-sm text-applus-text" type="button">
              Sorting A-Z
            </button>
            <button className="border border-applus-border px-3 py-1 text-sm text-applus-text" type="button">
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
            <input aria-label="Search menu" className="applus-field" placeholder="Search" type="text" />
          </div>
          <nav aria-label="Main navigation" className="px-2 py-1">
            <ul className="space-y-1">
              {["Sales Board", "Address Info", "Record Document"].map((item) => (
                <li key={item}>
                  <span className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-applus-muted">
                    <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-slate-500">≡</span>
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-2 border-t border-applus-border pt-2">
              <div className="mb-1 flex items-center justify-between px-3 py-2 text-sm font-medium text-applus-text">
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-applus-blue">▣</span>
                  Item Text
                </span>
                <span className="text-xs text-slate-500">⌃</span>
              </div>
              <ul className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        className={`flex items-center gap-3 border-l-2 px-3 py-2 text-sm ${
                          isActive ? "border-applus-blue bg-blue-50 font-medium" : "border-transparent hover:bg-applus-muted"
                        }`}
                        href={item.href}
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-slate-500">▤</span>
                        {item.menuLabel}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <ul className="mt-2 space-y-1 border-t border-applus-border pt-2">
              {["Quotations", "Orders", "Goods Issues", "Invoices", "Agreements", "Price Lists", "Costing", "Payment Plans", "Master Data"].map((item) => (
                <li key={item}>
                  <span className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-applus-muted">
                    <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-slate-500">≡</span>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="bg-[linear-gradient(180deg,rgba(10,112,235,0.18)_0%,rgba(232,240,250,0.8)_90px,rgba(244,247,251,1)_220px)] p-3 pb-24 sm:p-4 sm:pb-24 lg:p-5 lg:pb-5">
          <div className="mb-4 hidden border border-applus-border bg-white px-5 py-3 shadow-panel lg:block">
            <div className="flex items-center gap-6 overflow-x-auto text-xs text-applus-text">
              {[
                "1 angelegt",
                "2 bereit zur Freigabe",
                "3 freigegeben",
                "4 bestatigt",
                "5 versendet",
                "6 geliefert",
                "7 fakturiert",
                "8 storniert",
                "9 Muster"
              ].map((step, index) => (
                <div className="min-w-max" key={step}>
                  <div className="mb-2">{step}</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-3 w-3 rounded-full border border-white bg-white shadow-[0_0_0_2px_#2b7ae8]" />
                    {index < 8 ? <span className="h-[3px] w-20 bg-applus-blue/70" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 border border-applus-border bg-white px-4 py-2 text-sm shadow-panel lg:hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{title}</span>
              <span className="text-slate-500">Functions ›</span>
            </div>
          </div>

          <div className="min-h-[calc(100vh-210px)]">
            {children}
          </div>
        </main>

        <aside className="hidden border-l border-applus-border bg-white lg:block">
          <div className="flex items-center justify-between border-b border-applus-border px-4 py-4">
            <h2 className="text-sm font-semibold text-applus-text">Functions</h2>
            <span className="text-slate-500">⌕</span>
          </div>
          <nav aria-label="Functions" className="px-2 py-3">
            <ul className="space-y-1 text-sm text-applus-text">
              {functions.map((item, index) => (
                <li key={item}>
                  <span className={`flex items-center gap-3 border-l-2 px-3 py-2 ${index === 0 ? "border-applus-blue bg-blue-50 font-medium" : "border-transparent hover:bg-applus-muted"}`}>
                    <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-slate-500">▤</span>
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 border-t border-applus-border pt-2">
              <div className="mb-1 flex items-center justify-between px-3 py-2 text-sm font-medium text-applus-text">
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-applus-blue">▣</span>
                  Item Text
                </span>
                <span className="text-xs text-slate-500">⌃</span>
              </div>
              <ul className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        className={`flex items-center gap-3 border-l-2 px-3 py-2 text-sm ${
                          isActive ? "border-applus-blue bg-blue-50 font-medium" : "border-transparent hover:bg-applus-muted"
                        }`}
                        href={item.href}
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-slate-500">▤</span>
                        {item.menuLabel}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <ul className="mt-3 space-y-1 border-t border-applus-border pt-2 text-sm">
              {["Vorkalkulation", "Verfugbarkeit prufen", "Kreditlimitprufung", "GAEB-Angebot", "Anlage zuordnen"].map((item) => (
                <li key={item}>
                  <span className="flex items-center gap-3 px-3 py-2 hover:bg-applus-muted">
                    <span className="inline-flex h-4 w-4 items-center justify-center text-[10px] text-slate-500">≡</span>
                    {item}
                  </span>
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
                className={`border px-2 py-2 text-center text-[11px] font-medium ${isActive ? "border-applus-blue bg-blue-50 text-applus-blue" : "border-applus-border bg-applus-muted text-applus-text"}`}
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
