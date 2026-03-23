import Link from "next/link";
import type { ReactNode } from "react";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`overflow-hidden border border-applus-border bg-white p-4 shadow-panel ${className}`}>{children}</section>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="space-y-1 border-b border-applus-border pb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Workspace</p>
      <h2 className="text-[24px] font-semibold leading-none text-applus-text">{title}</h2>
      {subtitle ? <p className="text-[13px] leading-5 text-slate-600">{subtitle}</p> : null}
    </div>
  );
}

export function StatBox({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "accent" | "warm" }) {
  const toneClass = tone === "accent" ? "bg-blue-50 text-applus-blue" : tone === "warm" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-applus-text";
  return (
    <div className={`border border-applus-border px-3 py-2 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em]">{label}</p>
      <p className="mt-1 text-[24px] font-semibold leading-none">{value}</p>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  type = "button"
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      className="border border-applus-blue bg-applus-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="inline-flex items-center border border-applus-border bg-white px-4 py-2 text-sm font-medium text-applus-text hover:bg-applus-muted" href={href}>
      {children}
    </Link>
  );
}

export function ToggleChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={`border px-3 py-2 text-sm ${active ? "border-applus-blue bg-blue-50 font-medium text-applus-blue" : "border-applus-border bg-white text-applus-text hover:bg-applus-muted"}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
