"use client";

import Link from "next/link";
import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { Panel, PrimaryButton, SectionTitle } from "@/components/ui";
import { useAppStore } from "@/hooks/use-app-store";
import { capturePhrase, completeTodayStep, getCurrentInputItems, getTodayPlanView } from "@/lib/app-state";

export default function StudyInputPage() {
  const { hydrated, state, updateState } = useAppStore();
  const [draft, setDraft] = useState("");
  const [draftMeaning, setDraftMeaning] = useState("");

  if (!hydrated || !state) {
    return (
      <AppShell activeRoute="/study/input" title="Input">
        <Panel>Loading input library...</Panel>
      </AppShell>
    );
  }

  const today = getTodayPlanView(state);
  const inputItems = getCurrentInputItems(state);

  return (
    <AppShell activeRoute="/study/input" title="Input">
      <div className="grid gap-4 xl:grid-cols-[1.14fr_0.86fr]">
        <Panel className="space-y-4">
          <SectionTitle subtitle="Shadow to speak: notice, capture, then move straight into the current mission." title="Input Library" />
          {inputItems.map((item) => (
            <article className="applus-soft-panel p-4" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {item.kind} • {item.level} • {item.durationMin} min
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.summary}</p>
                </div>
                <div className="border border-applus-border bg-white px-3 py-2 text-xs uppercase tracking-[0.08em] text-slate-600">{item.handoffMissionType}</div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Purpose</p>
                  <p className="mt-2 text-sm text-slate-600">{item.purpose}</p>
                  <p className="mt-4 text-sm font-semibold">Key chunks</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.keyChunks.map((chunk) => (
                      <span className="border border-applus-border bg-white px-2 py-1 text-sm" key={chunk}>
                        {chunk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Noticing checklist</p>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600">
                    {item.noticingChecklist.map((point) => (
                      <li key={point}>• {point}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold">Capture suggestions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.captureSuggestions.map((phrase) => (
                    <button
                      className="border border-applus-border bg-white px-3 py-2 text-sm hover:bg-applus-muted"
                      key={phrase}
                      onClick={() => updateState((current) => capturePhrase(current, phrase, item.id, { meaningOrPromptPl: `Powiedz po hiszpansku: ${phrase}`, topicId: item.topicId }))}
                      type="button"
                    >
                      Capture: {phrase}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-applus-border pt-4">
                <p className="text-sm font-semibold">Shadow to speak handoff</p>
                <p className="mt-2 text-sm text-slate-600">Po materiale od razu zrob krotki retell albo opinion run z tymi chunkami.</p>
                <div className="mt-3">
                  <Link className="border border-applus-blue bg-white px-3 py-2 text-sm font-medium text-applus-blue hover:bg-blue-50" href="/study/speak">
                    Go to current mission
                  </Link>
                </div>
              </div>
            </article>
          ))}
          <PrimaryButton onClick={() => updateState((current) => completeTodayStep(current, "input"))}>Mark input done</PrimaryButton>
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-4">
            <SectionTitle subtitle="Quick personal capture should always land inside a learning context, not in a dead inbox." title="Quick Capture" />
            <textarea className="applus-textarea min-h-32" onChange={(event) => setDraft(event.target.value)} placeholder="Wklej przydatna fraze..." value={draft} />
            <input className="applus-field" onChange={(event) => setDraftMeaning(event.target.value)} placeholder="Krótki prompt/meaning po polsku" value={draftMeaning} />
            <PrimaryButton
              onClick={() => {
                updateState((current) => capturePhrase(current, draft, "quick-capture", { meaningOrPromptPl: draftMeaning, topicId: today.weeklyFocus.id }));
                setDraft("");
                setDraftMeaning("");
              }}
            >
              Add to activation queue
            </PrimaryButton>
          </Panel>

          <Panel className="space-y-4">
            <SectionTitle subtitle="Current week is not just a topic label; it defines what should become active language." title="Weekly Focus Chunks" />
            <div className="applus-grid-table">
              {today.targetChunks.map((chunk) => (
                <div className="applus-grid-row" key={chunk}>
                  <div>
                    <p className="font-medium">{chunk}</p>
                    <p className="text-sm text-slate-600">Use this chunk in today's mission, not only in recognition.</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
