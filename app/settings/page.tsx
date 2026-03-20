"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { updateSettings } from "@/lib/app-state";

export default function SettingsPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [formState, setFormState] = useState({
    dailyMinutes: 20,
    newCardsCap: 5,
    srsMinutesCap: 8,
    locale: "es-ES"
  });

  useEffect(() => {
    if (!state) {
      return;
    }
    setFormState(state.settings);
  }, [state]);

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/settings" title="Settings">
        <Panel>Loading settings...</Panel>
      </AppShell>
    );
  }

  return (
    <AppShell activeRoute="/settings" title="Settings">
      <Panel className="space-y-5">
        <SectionTitle subtitle="Solo local MVP, bez konta i bez synchronizacji cloud." title="Preferences" />

        <label className="grid gap-2 text-sm">
          Daily minutes
          <input className="rounded border border-applus-border px-3 py-2" min={15} onChange={(event) => setFormState((current) => ({ ...current, dailyMinutes: Number(event.target.value) }))} type="number" value={formState.dailyMinutes} />
        </label>

        <label className="grid gap-2 text-sm">
          New cards cap
          <input className="rounded border border-applus-border px-3 py-2" min={1} onChange={(event) => setFormState((current) => ({ ...current, newCardsCap: Number(event.target.value) }))} type="number" value={formState.newCardsCap} />
        </label>

        <label className="grid gap-2 text-sm">
          SRS minutes cap
          <input className="rounded border border-applus-border px-3 py-2" max={10} min={5} onChange={(event) => setFormState((current) => ({ ...current, srsMinutesCap: Number(event.target.value) }))} type="number" value={formState.srsMinutesCap} />
        </label>

        <label className="grid gap-2 text-sm">
          Locale
          <select className="rounded border border-applus-border px-3 py-2" onChange={(event) => setFormState((current) => ({ ...current, locale: event.target.value }))} value={formState.locale}>
            <option value="es-ES">es-ES</option>
          </select>
        </label>

        <div className="rounded border border-applus-border bg-applus-muted p-4 text-sm text-slate-600">
          Optional AI endpoints:
          <br />
          <code>POST /api/ai/prompt</code>
          <br />
          <code>POST /api/ai/feedback</code>
          <br />
          Aktywne tylko z <code>OPENAI_API_KEY</code>.
        </div>

        <PrimaryButton onClick={() => updateState((current) => updateSettings(current, formState))}>Save settings</PrimaryButton>
      </Panel>
    </AppShell>
  );
}
