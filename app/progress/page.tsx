"use client";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle, StatBox } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { getCurrentWeeklyFocus, getDashboardSummary, getSnapshotTargets, getWeeklyLogs, startNextWeeklyFocus } from "@/lib/app-state";
import { formatShortDate } from "@/lib/date";

export default function ProgressPage() {
  const { hydrated, state, updateState } = useAppStore();

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/progress" title="Progress">
        <Panel>Loading progress...</Panel>
      </AppShell>
    );
  }

  const weeklyLogs = getWeeklyLogs(state);
  const snapshots = getSnapshotTargets(state);
  const dashboard = getDashboardSummary(state);
  const focus = getCurrentWeeklyFocus(state);
  const totalMinutes = weeklyLogs.reduce((sum, item) => sum + item.totalMin, 0);
  const spokeDays = weeklyLogs.filter((item) => item.spoke).length;
  const missionDays = weeklyLogs.filter((item) => item.missionCompleted).length;

  return (
    <AppShell activeRoute="/progress" title="Progress">
      <div className="space-y-4">
        <Panel className="space-y-4">
          <SectionTitle subtitle="Track transfer into speaking, not only raw activity." title="Weekly Transfer" />
          <div className="grid gap-3 md:grid-cols-4">
            <StatBox label="minutes" value={totalMinutes} />
            <StatBox label="spoke days" tone="accent" value={spokeDays} />
            <StatBox label="activated" value={dashboard.activatedThisWeek} />
            <StatBox label="reused" tone="warm" value={dashboard.reusedThisWeek} />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatBox label="missions" value={missionDays} />
            <StatBox label="tutor carried" value={dashboard.tutorConversionsThisWeek} />
            <StatBox label="avg mission" value={dashboard.averageMissionMinutes || "-"} />
          </div>
          <div className="applus-note p-4 text-sm text-slate-600">
            Weekly focus: <strong>{focus.context}</strong>. Recommendation:{" "}
            <strong>
              {dashboard.weeklyRecommendation === "reduce_new_cards"
                ? "reduce new cards and recycle what you already have"
                : dashboard.weeklyRecommendation === "repeat_focus"
                  ? "repeat this focus until chunk reuse feels easier"
                  : "move to the next weekly focus"}
            </strong>
            .
          </div>
          <PrimaryButton onClick={() => updateState((current) => startNextWeeklyFocus(current))}>Load next weekly focus</PrimaryButton>
        </Panel>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Daily logs now include mission completion and activation counts." title="Last 7 Days" />
          <div className="space-y-3">
            {weeklyLogs.map((item) => (
              <div className="applus-soft-panel p-4" key={item.date}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{formatShortDate(item.date)}</p>
                    <p className="text-sm text-slate-600">
                      {item.totalMin} min • review {item.reviewCount} • new {item.newCount}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    mission {item.missionCompleted ? "done" : "open"} • activated {item.activatedCount} • reused {item.reusedCount}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Snapshots still exist, but now they sit next to mission-based speaking progress." title="Speaking Snapshots" />
          <div className="grid gap-3 md:grid-cols-3">
            {snapshots.map((snapshot) => (
              <div className="border border-applus-border bg-white p-4" key={snapshot.day}>
                <p className="text-xs uppercase tracking-wide text-slate-500">Day {snapshot.day}</p>
                <p className="mt-2 font-semibold">{snapshot.session ? "Saved" : snapshot.due ? "Due now" : "Upcoming"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {snapshot.session
                    ? `Session ${snapshot.session.durationMin} min • confidence ${snapshot.session.selfScores.confidence}/5`
                    : "Wykonaj krotka misje speaking i zapisz self-check."}
                </p>
                {snapshot.session?.audioRef ? <audio className="mt-3 w-full" controls src={snapshot.session.audioRef} /> : null}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
