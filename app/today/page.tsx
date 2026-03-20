"use client";

import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle, StatBox, ToggleChip } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { getTodayLog, setTodayMode, setTodayTemplate, toggleTodayStep, updateDailyReflection } from "@/lib/app-state";
import { formatLongDate } from "@/lib/date";

export default function TodayPage() {
  const { hydrated, state, derived, updateState } = useAppStore();

  if (!hydrated || !state || !derived) {
    return (
      <AppShell activeRoute="/today" title="Today">
        <Panel>Loading daily workspace...</Panel>
      </AppShell>
    );
  }

  const { today, dashboard } = derived;
  const log = getTodayLog(state);

  return (
    <AppShell activeRoute="/today" title="Today">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle={formatLongDate(today.date)} title="Daily Plan" />
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={today.mode === "quiet"} label="quiet / public" onClick={() => updateState((current) => setTodayMode(current, "quiet"))} />
              <ToggleChip active={today.mode === "voice"} label="voice / private" onClick={() => updateState((current) => setTodayMode(current, "voice"))} />
              <ToggleChip active={today.template === "standard"} label="20 min" onClick={() => updateState((current) => setTodayTemplate(current, "standard"))} />
              <ToggleChip active={today.template === "minimum"} label="5+5+5" onClick={() => updateState((current) => setTodayTemplate(current, "minimum"))} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {today.steps.map((step) => (
                <div className="rounded border border-applus-border bg-applus-muted p-4" key={step.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{step.minutes} min</p>
                    </div>
                    <span className={`rounded px-2 py-1 text-xs ${step.completed ? "bg-blue-50 text-applus-blue" : "bg-white text-slate-600"}`}>{step.completed ? "done" : "open"}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{step.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="rounded border border-applus-border px-3 py-2 text-sm hover:bg-white" href={step.route}>
                      Open
                    </Link>
                    <button
                      className="rounded border border-applus-blue px-3 py-2 text-sm text-applus-blue hover:bg-blue-50"
                      onClick={() => updateState((current) => toggleTodayStep(current, step.id))}
                      type="button"
                    >
                      {step.completed ? "Undo" : "Complete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Szybki log dnia bez wychodzenia z workspace." title="Daily Reflection" />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="rounded border border-applus-border bg-applus-muted p-4 text-sm">
                Stres
                <input
                  className="mt-3 w-full accent-[#0a70eb]"
                  max={5}
                  min={1}
                  onChange={(event) => updateState((current) => updateDailyReflection(current, { stress: Number(event.target.value), confidence: log.confidence }))}
                  type="range"
                  value={log.stress}
                />
                <span className="mt-2 block font-semibold">{log.stress}/5</span>
              </label>
              <label className="rounded border border-applus-border bg-applus-muted p-4 text-sm">
                Pewnosc
                <input
                  className="mt-3 w-full accent-[#0a70eb]"
                  max={5}
                  min={1}
                  onChange={(event) => updateState((current) => updateDailyReflection(current, { stress: log.stress, confidence: Number(event.target.value) }))}
                  type="range"
                  value={log.confidence}
                />
                <span className="mt-2 block font-semibold">{log.confidence}/5</span>
              </label>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Najwazniejsze metryki bez rozbudowanego dashboardu." title="Today Status" />
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="due" tone="warm" value={dashboard.dueCards.length} />
              <StatBox label="done" tone="accent" value={`${today.completedCount}/${today.steps.length}`} />
              <StatBox label="review" value={log.reviewCount} />
              <StatBox label="new" value={log.newCount} />
            </div>
            <p className="text-sm text-slate-600">
              Status dnia: <strong>{log.completed ? "domkniety" : "w toku"}</strong>. Mowienie: <strong>{log.spoke ? "tak" : "nie"}</strong>.
            </p>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Kontrola przeciazenia review backlogu." title="SRS Pressure" />
            <p className="text-sm text-slate-600">
              {dashboard.backlogBlocked ? "Backlog jest za duzy, nowe karty powinny byc zablokowane." : "Mozesz dodac kilka nowych kart w granicach dziennego limitu."}
            </p>
            <PrimaryButton onClick={() => updateState((current) => setTodayTemplate(current, "minimum"))}>Switch to 5+5+5</PrimaryButton>
          </Panel>

          <Panel className="space-y-3">
            <SectionTitle subtitle="Frazy do odzyskania glosowo w ciagu 48h." title="Recycle" />
            {dashboard.recycleCandidates.length === 0 ? (
              <p className="text-sm text-slate-600">Brak pilnych fraz.</p>
            ) : (
              dashboard.recycleCandidates.map((item) => (
                <div className="rounded border border-applus-border bg-applus-muted p-3" key={item.id}>
                  <p className="font-medium">{item.textEs}</p>
                  <p className="text-sm text-slate-600">{item.source}</p>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
