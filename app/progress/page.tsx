"use client";

import { AppShell } from "@/components/app-shell";
import { Panel, SectionTitle, StatBox } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { getSnapshotTargets, getWeeklyLogs } from "@/lib/app-state";
import { formatShortDate } from "@/lib/date";

export default function ProgressPage() {
  const { hydrated, state } = useAppStore();

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/progress" title="Progress">
        <Panel>Loading progress...</Panel>
      </AppShell>
    );
  }

  const weeklyLogs = getWeeklyLogs(state);
  const snapshots = getSnapshotTargets(state);
  const totalMinutes = weeklyLogs.reduce((sum, item) => sum + item.totalMin, 0);
  const totalReview = weeklyLogs.reduce((sum, item) => sum + item.reviewCount, 0);
  const spokeDays = weeklyLogs.filter((item) => item.spoke).length;

  return (
    <AppShell activeRoute="/progress" title="Progress">
      <div className="space-y-4">
        <Panel className="space-y-4">
          <SectionTitle subtitle="Lekki widok tygodniowy zamiast rozbudowanej analityki." title="Last 7 Days" />
          <div className="grid gap-3 md:grid-cols-3">
            <StatBox label="minutes" value={totalMinutes} />
            <StatBox label="review" tone="warm" value={totalReview} />
            <StatBox label="spoke days" tone="accent" value={spokeDays} />
          </div>
          <div className="space-y-3">
            {weeklyLogs.map((item) => (
              <div className="rounded border border-applus-border bg-applus-muted p-4" key={item.date}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{formatShortDate(item.date)}</p>
                    <p className="text-sm text-slate-600">
                      {item.totalMin} min • review {item.reviewCount} • new {item.newCount}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
                    {item.spoke ? "spoke" : "quiet only"} • stres {item.stress}/5 • pewnosc {item.confidence}/5
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="space-y-4">
          <SectionTitle subtitle="Snapshoty 1 / 7 / 14 dla mowienia." title="Speaking Snapshots" />
          <div className="grid gap-3 md:grid-cols-3">
            {snapshots.map((snapshot) => (
              <div className="rounded border border-applus-border bg-white p-4" key={snapshot.day}>
                <p className="text-xs uppercase tracking-wide text-slate-500">Day {snapshot.day}</p>
                <p className="mt-2 font-semibold">{snapshot.session ? "Saved" : snapshot.due ? "Due now" : "Upcoming"}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {snapshot.session ? `Session ${snapshot.session.durationMin} min • confidence ${snapshot.session.selfScores.confidence}/5` : "Wykonaj krotkie nagranie i self-check."}
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
