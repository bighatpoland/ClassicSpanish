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
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle={formatLongDate(today.date)} title="Daily Mission Plan" />
            <div className="flex flex-wrap gap-2">
              <ToggleChip active={today.mode === "quiet"} label="quiet / public" onClick={() => updateState((current) => setTodayMode(current, "quiet"))} />
              <ToggleChip active={today.mode === "voice"} label="voice / private" onClick={() => updateState((current) => setTodayMode(current, "voice"))} />
              <ToggleChip active={today.template === "standard"} label="20 min" onClick={() => updateState((current) => setTodayTemplate(current, "standard"))} />
              <ToggleChip active={today.template === "minimum"} label="5+5+5" onClick={() => updateState((current) => setTodayTemplate(current, "minimum"))} />
            </div>

            <div className="applus-soft-panel p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Weekly focus</p>
              <h3 className="mt-2 text-xl font-semibold">{today.weeklyFocus.context}</h3>
              <p className="mt-2 text-sm text-slate-600">{today.communicativeGoal}</p>
            </div>

            <div className="border border-applus-border bg-white">
              <div className="border-b border-applus-border px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Speaking mission</p>
                <h3 className="mt-1 text-xl font-semibold">{today.mission.prompt}</h3>
              </div>
              <div className="grid gap-4 px-4 py-4 md:grid-cols-[1fr_auto]">
                <div>
                  <p className="text-sm text-slate-600">
                    Typ: <strong>{today.mission.type}</strong>. Czas: <strong>{today.mission.durationMin} min</strong>.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    {today.mission.completionCriteria.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-start">
                  <Link className="border border-applus-blue bg-white px-4 py-2 text-sm font-medium text-applus-blue hover:bg-blue-50" href="/study/speak">
                    Open mission
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {today.steps.map((step) => (
                <div className="border border-applus-border bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] p-4" key={step.id}>
                  <div className="flex items-start justify-between gap-3 border-b border-applus-border pb-3">
                    <div>
                      <p className="text-base font-semibold">{step.title}</p>
                      <p className="mt-1 text-[12px] uppercase tracking-[0.08em] text-slate-500">{step.minutes} min</p>
                    </div>
                    <span className={`border px-2 py-1 text-xs font-semibold uppercase tracking-[0.06em] ${step.completed ? "border-applus-blue bg-blue-50 text-applus-blue" : "border-applus-border bg-white text-slate-600"}`}>
                      {step.completed ? "done" : "open"}
                    </span>
                  </div>
                  <p className="mt-3 min-h-16 text-sm leading-5 text-slate-600">{step.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted" href={step.route}>
                      Open
                    </Link>
                    <button
                      className="border border-applus-blue bg-white px-3 py-2 text-sm font-medium text-applus-blue hover:bg-blue-50"
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
            <SectionTitle subtitle="Te chunky i frazy powinny dzis wejsc do aktywnego uzycia." title="Use Today Queue" />
            <div className="applus-grid-table">
              {today.useTodayQueue.map((item) => (
                <div className="applus-grid-row md:grid-cols-[minmax(0,1fr)_160px_140px]" key={item.id}>
                  <div>
                    <p className="font-medium">{item.text}</p>
                    <p className="text-sm text-slate-600">{item.reason}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    {item.source} • {item.activationStage.replaceAll("_", " ")}
                  </div>
                  <div className="text-sm font-medium text-applus-blue">{item.dueNow ? "use now" : "keep warm"}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Szybki log dnia bez wychodzenia z workspace." title="Daily Reflection" />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="border border-applus-border bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] p-4 text-sm">
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
              <label className="border border-applus-border bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] p-4 text-sm">
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
            <SectionTitle subtitle="Najwazniejsze metryki speaking-first na dzis i na ten tydzien." title="Today Status" />
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="due" tone="warm" value={dashboard.dueCards.length} />
              <StatBox label="done" tone="accent" value={`${today.completedCount}/${today.steps.length}`} />
              <StatBox label="activated" value={log.activatedCount} />
              <StatBox label="reused" value={log.reusedCount} />
            </div>
            <p className="text-sm text-slate-600">
              Status dnia: <strong>{log.completed ? "domkniety" : "w toku"}</strong>. Misja: <strong>{log.missionCompleted ? "zaliczona" : "do zrobienia"}</strong>.
            </p>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="SRS sluzy teraz pamieci, ale sukces mierzymy realnym uzyciem." title="Activation Pulse" />
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="week activated" value={dashboard.activatedThisWeek} />
              <StatBox label="week reused" tone="accent" value={dashboard.reusedThisWeek} />
              <StatBox label="tutor carryover" value={dashboard.tutorConversionsThisWeek} />
              <StatBox label="avg mission" tone="warm" value={dashboard.averageMissionMinutes || "-"} />
            </div>
            <p className="text-sm text-slate-600">
              Recommendation:{" "}
              <strong>
                {dashboard.weeklyRecommendation === "reduce_new_cards"
                  ? "reduce new cards"
                  : dashboard.weeklyRecommendation === "repeat_focus"
                    ? "repeat this focus"
                    : "move to next focus"}
              </strong>
            </p>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Kontrola przeciazenia review backlogu i reuse pressure." title="SRS Pressure" />
            <p className="text-sm text-slate-600">
              {dashboard.backlogBlocked ? "Backlog jest za duzy, nowe karty powinny byc zablokowane i trzeba skupic sie na reuse." : "Mozesz dodac kilka nowych kart, ale tylko tych potrzebnych do dzisiejszej misji."}
            </p>
            <PrimaryButton onClick={() => updateState((current) => setTodayTemplate(current, "minimum"))}>Switch to 5+5+5</PrimaryButton>
          </Panel>

          <Panel className="space-y-3">
            <SectionTitle subtitle="Poprawki z lekcji, ktore powinny wejsc do tej samej puli aktywacji." title="Tutor Carryover" />
            {today.tutorCarryover.length === 0 ? (
              <p className="text-sm text-slate-600">Brak pilnych poprawek z lekcji.</p>
            ) : (
              today.tutorCarryover.map((item) => (
                <div className="border border-applus-border bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] p-3" key={item.id}>
                  <p className="font-medium">{item.text}</p>
                  <p className="text-sm text-slate-600">{item.pin.replaceAll("_", " ")}</p>
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
