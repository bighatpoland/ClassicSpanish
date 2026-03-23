"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { updateLearnerProfile, updateSettings } from "@/lib/app-state";

export default function SettingsPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [settingsState, setSettingsState] = useState({
    dailyMinutes: 20,
    newCardsCap: 3,
    srsMinutesCap: 8,
    locale: "es-ES"
  });
  const [profileState, setProfileState] = useState({
    levelBand: "A2-B1",
    priorityContexts: "rutina, trabajo, planes",
    mainBarrier: "hesitation",
    weeklyIntensity: "steady",
    tutorFrequency: "weekly",
    preferredLessonMode: "voice"
  });

  useEffect(() => {
    if (!state) {
      return;
    }
    setSettingsState(state.settings);
    setProfileState({
      levelBand: state.learnerProfile.levelBand,
      priorityContexts: state.learnerProfile.priorityContexts.join(", "),
      mainBarrier: state.learnerProfile.mainBarrier,
      weeklyIntensity: state.learnerProfile.weeklyIntensity,
      tutorFrequency: state.learnerProfile.tutorFrequency,
      preferredLessonMode: state.learnerProfile.preferredLessonMode
    });
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
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel className="space-y-5">
          <SectionTitle subtitle="Solo local MVP, bez konta i bez synchronizacji cloud." title="Preferences" />

          <label className="grid gap-2 text-sm">
            Daily minutes
            <input className="applus-field" min={15} onChange={(event) => setSettingsState((current) => ({ ...current, dailyMinutes: Number(event.target.value) }))} type="number" value={settingsState.dailyMinutes} />
          </label>

          <label className="grid gap-2 text-sm">
            New cards cap
            <input className="applus-field" min={1} onChange={(event) => setSettingsState((current) => ({ ...current, newCardsCap: Number(event.target.value) }))} type="number" value={settingsState.newCardsCap} />
          </label>

          <label className="grid gap-2 text-sm">
            SRS minutes cap
            <input className="applus-field" max={10} min={5} onChange={(event) => setSettingsState((current) => ({ ...current, srsMinutesCap: Number(event.target.value) }))} type="number" value={settingsState.srsMinutesCap} />
          </label>

          <label className="grid gap-2 text-sm">
            Locale
            <select className="applus-select" onChange={(event) => setSettingsState((current) => ({ ...current, locale: event.target.value }))} value={settingsState.locale}>
              <option value="es-ES">es-ES</option>
            </select>
          </label>

          <div className="applus-note p-4 text-sm text-slate-600">
            Optional AI endpoints:
            <br />
            <code>POST /api/ai/prompt</code>
            <br />
            <code>POST /api/ai/feedback</code>
            <br />
            Aktywne tylko z <code>OPENAI_API_KEY</code>.
          </div>

          <PrimaryButton onClick={() => updateState((current) => updateSettings(current, settingsState))}>Save settings</PrimaryButton>
        </Panel>

        <Panel className="space-y-5">
          <SectionTitle subtitle="This profile drives weekly focus selection and task shaping for an adult A2-B1 learner." title="Learner Profile" />

          <label className="grid gap-2 text-sm">
            Level band
            <select className="applus-select" onChange={(event) => setProfileState((current) => ({ ...current, levelBand: event.target.value }))} value={profileState.levelBand}>
              <option value="A0-A1">A0-A1</option>
              <option value="A1-A2">A1-A2</option>
              <option value="A2-B1">A2-B1</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            Priority contexts
            <input className="applus-field" onChange={(event) => setProfileState((current) => ({ ...current, priorityContexts: event.target.value }))} value={profileState.priorityContexts} />
          </label>

          <label className="grid gap-2 text-sm">
            Main barrier
            <select className="applus-select" onChange={(event) => setProfileState((current) => ({ ...current, mainBarrier: event.target.value }))} value={profileState.mainBarrier}>
              <option value="hesitation">hesitation</option>
              <option value="confidence">confidence</option>
              <option value="connectors">connectors</option>
              <option value="sentence-length">sentence length</option>
              <option value="repair">repair</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            Weekly intensity
            <select className="applus-select" onChange={(event) => setProfileState((current) => ({ ...current, weeklyIntensity: event.target.value }))} value={profileState.weeklyIntensity}>
              <option value="light">light</option>
              <option value="steady">steady</option>
              <option value="focused">focused</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            Tutor frequency
            <select className="applus-select" onChange={(event) => setProfileState((current) => ({ ...current, tutorFrequency: event.target.value }))} value={profileState.tutorFrequency}>
              <option value="weekly">weekly</option>
              <option value="twice-weekly">twice-weekly</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            Preferred lesson mode
            <select className="applus-select" onChange={(event) => setProfileState((current) => ({ ...current, preferredLessonMode: event.target.value }))} value={profileState.preferredLessonMode}>
              <option value="voice">voice</option>
              <option value="quiet">quiet</option>
            </select>
          </label>

          <PrimaryButton
            onClick={() =>
              updateState((current) =>
                updateLearnerProfile(current, {
                  levelBand: profileState.levelBand as "A0-A1" | "A1-A2" | "A2-B1",
                  priorityContexts: profileState.priorityContexts
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  mainBarrier: profileState.mainBarrier as "hesitation" | "confidence" | "connectors" | "sentence-length" | "repair",
                  weeklyIntensity: profileState.weeklyIntensity as "light" | "steady" | "focused",
                  tutorFrequency: profileState.tutorFrequency as "weekly" | "twice-weekly",
                  preferredLessonMode: profileState.preferredLessonMode as "quiet" | "voice"
                })
              )
            }
          >
            Save learner profile
          </PrimaryButton>
        </Panel>
      </div>
    </AppShell>
  );
}
